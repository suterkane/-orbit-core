import asyncio
import base64
import json
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

import websockets

CDP_HTTP = "http://127.0.0.1:9223/json"
PAGE_URL = "http://127.0.0.1:8000/index.html?cinematic-video=1"
OUT = Path.home() / "AppData" / "Local" / "Temp" / "orbit-neural-video"
RAW = OUT / "raw"
SEQ = OUT / "sequence"
VIDEO = OUT / "orbit-cinematic-30fps.mp4"
SUMMARY = OUT / "summary.json"


async def main():
    shutil.rmtree(OUT, ignore_errors=True)
    RAW.mkdir(parents=True)
    SEQ.mkdir(parents=True)
    targets = json.load(urllib.request.urlopen(CDP_HTTP))
    target = next(item for item in targets if item.get("type") == "page")
    frames = []
    diagnostics = []
    pending = {}
    counter = 0

    async with websockets.connect(target["webSocketDebuggerUrl"], max_size=25_000_000) as ws:
        async def receiver():
            nonlocal counter
            async for raw in ws:
                message = json.loads(raw)
                message_id = message.get("id")
                if message_id in pending:
                    future = pending.pop(message_id)
                    if not future.done():
                        future.set_result(message)
                    continue
                method = message.get("method")
                if method == "Page.screencastFrame":
                    params = message["params"]
                    stamp = params.get("metadata", {}).get("timestamp", time.perf_counter())
                    index = len(frames)
                    path = RAW / f"frame-{index:05d}.jpg"
                    path.write_bytes(base64.b64decode(params["data"]))
                    frames.append((stamp, path))
                    counter += 1
                    await ws.send(json.dumps({
                        "id": counter,
                        "method": "Page.screencastFrameAck",
                        "params": {"sessionId": params["sessionId"]},
                    }))
                elif method in {"Runtime.exceptionThrown", "Log.entryAdded", "Network.loadingFailed"}:
                    diagnostics.append(message)

        receive_task = asyncio.create_task(receiver())

        async def call(method, params=None):
            nonlocal counter
            counter += 1
            request_id = counter
            future = asyncio.get_running_loop().create_future()
            pending[request_id] = future
            await ws.send(json.dumps({"id": request_id, "method": method, "params": params or {}}))
            message = await asyncio.wait_for(future, timeout=20)
            if "error" in message:
                raise RuntimeError(message["error"])
            return message.get("result", {})

        async def evaluate(expression):
            result = await call("Runtime.evaluate", {"expression": expression, "returnByValue": True})
            return result.get("result", {}).get("value")

        await call("Page.enable")
        await call("Runtime.enable")
        await call("Log.enable")
        await call("Network.enable")
        await call("Network.setCacheDisabled", {"cacheDisabled": True})
        await call("Network.setBypassServiceWorker", {"bypass": True})
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 3, "mobile": True
        })
        await call("Page.navigate", {"url": PAGE_URL})
        await asyncio.sleep(2)
        diagnostics.clear()
        await call("Page.bringToFront")
        await call("Page.startScreencast", {
            "format": "jpeg", "quality": 92, "maxWidth": 390, "maxHeight": 844,
            "everyNthFrame": 1,
        })
        await asyncio.sleep(.8)

        point = await evaluate("(()=>{const r=document.querySelector('#initiateBtn').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()")
        await call("Input.dispatchMouseEvent", {"type": "mousePressed", "x": point["x"], "y": point["y"], "button": "left", "clickCount": 1})
        await call("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": point["x"], "y": point["y"], "button": "left", "clickCount": 1})
        await asyncio.sleep(6.5)

        await evaluate("ORBITNeuralCore.setState('thinking')")
        for index in range(30):
            rms = .36 + (index % 5) * .1
            transient = .82 if index in {0, 10, 20} else .12
            await evaluate(f"ORBITNeuralCore.pushVoiceFrame({{active:true,rms:{rms:.2f},low:.58,mid:.46,high:.28,transient:{transient:.2f}}})")
            await asyncio.sleep(.067)

        await evaluate("ORBITNeuralCore.pushVoiceFrame({active:false,rms:0,low:0,mid:0,high:0,transient:0});ORBITNeuralCore.setState('listening')")
        await asyncio.sleep(1.4)

        await evaluate("ORBITNeuralCore.setState('speaking')")
        for index in range(24):
            rms = .3 + (index % 4) * .14
            transient = .76 if index in {0, 8, 16} else .08
            await evaluate(f"ORBITNeuralCore.pushVoiceFrame({{active:true,phase:'speaking',rms:{rms:.2f},low:.62,mid:.5,high:.34,transient:{transient:.2f}}})")
            await asyncio.sleep(.067)

        await evaluate("ORBITNeuralCore.pushVoiceFrame({active:false,rms:0,low:0,mid:0,high:0,transient:0});ORBITNeuralCore.setState('confirm')")
        await asyncio.sleep(1.1)
        await evaluate("ORBITNeuralCore.setState('idle')")
        await asyncio.sleep(1.0)
        telemetry = await evaluate("ORBITNeuralCore.telemetry()")
        await call("Page.stopScreencast")
        await asyncio.sleep(.2)
        receive_task.cancel()
        try:
            await receive_task
        except asyncio.CancelledError:
            pass

    if len(frames) < 2:
        raise RuntimeError(f"Screencast produced only {len(frames)} frame(s)")
    frames.sort(key=lambda item: item[0])
    start, end = frames[0][0], frames[-1][0]
    duration = max(.001, end - start)
    source_fps = (len(frames) - 1) / duration
    output_frames = max(1, round(duration * 30))
    source_index = 0
    for output_index in range(output_frames):
        target_stamp = start + output_index / 30
        while source_index + 1 < len(frames) and frames[source_index + 1][0] <= target_stamp:
            source_index += 1
        shutil.copyfile(frames[source_index][1], SEQ / f"frame-{output_index:05d}.jpg")

    subprocess.run([
        "ffmpeg", "-y", "-framerate", "30", "-i", str(SEQ / "frame-%05d.jpg"),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(VIDEO),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    report = {
        "video": str(VIDEO),
        "durationSeconds": round(duration, 3),
        "capturedUniqueFrames": len(frames),
        "sourceFps": round(source_fps, 3),
        "encodedFps": 30,
        "encodedFrames": output_frames,
        "diagnosticCount": len(diagnostics),
        "diagnostics": diagnostics,
        "telemetry": telemetry,
        "acceptance": {
            "sourceFpsAtLeast24": source_fps >= 24,
            "durationAtLeast13": duration >= 13,
            "noBrowserDiagnostics": not diagnostics,
            "fiveDrawCalls": telemetry.get("renderCalls") == 5,
            "docked": telemetry.get("layout") == "docked",
        },
    }
    SUMMARY.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not all(report["acceptance"].values()):
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
