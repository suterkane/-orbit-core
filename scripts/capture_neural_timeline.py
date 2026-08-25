import asyncio
import base64
import json
import time
import urllib.request
from pathlib import Path

import websockets

CDP_HTTP = "http://127.0.0.1:9223"
PAGE_URL = "http://127.0.0.1:4173/?orbit-verify=timeline"
OUT = Path.home() / "AppData/Local/Temp/orbit-neural-timeline"


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    targets = json.load(urllib.request.urlopen(f"{CDP_HTTP}/json"))
    target = next(t for t in targets if t.get("type") == "page")
    async with websockets.connect(target["webSocketDebuggerUrl"], max_size=20_000_000) as ws:
        counter = 0
        diagnostics = []

        async def call(method, params=None):
            nonlocal counter
            counter += 1
            request_id = counter
            await ws.send(json.dumps({"id": request_id, "method": method, "params": params or {}}))
            while True:
                message = json.loads(await ws.recv())
                if message.get("id") == request_id:
                    if "error" in message:
                        raise RuntimeError(message["error"])
                    return message.get("result", {})
                if message.get("method") in {"Runtime.exceptionThrown", "Log.entryAdded", "Network.loadingFailed"}:
                    diagnostics.append(message)

        await call("Page.enable")
        await call("Runtime.enable")
        await call("Log.enable")
        await call("Network.enable")
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 3, "mobile": True
        })
        await call("Page.navigate", {"url": PAGE_URL})
        await asyncio.sleep(2)
        diagnostics.clear()

        async def shot(name):
            state = await call("Runtime.evaluate", {
                "expression": "JSON.stringify({telemetry:ORBITNeuralCore?.telemetry?.(),assembling:document.querySelector('#fridayHologram')?.dataset.assembling,appHidden:document.querySelector('#app')?.classList.contains('hidden'),appOpacity:getComputedStyle(document.querySelector('#app')).opacity})",
                "returnByValue": True,
            })
            image = await call("Page.captureScreenshot", {"format": "png", "fromSurface": True})
            (OUT / f"{name}.png").write_bytes(base64.b64decode(image["data"]))
            print(name, state["result"]["value"])

        await shot("00-dormant")
        bounds = await call("Runtime.evaluate", {"expression": "(()=>{const r=document.querySelector('#initiateBtn').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()", "returnByValue": True})
        point = bounds["result"]["value"]
        await call("Input.dispatchMouseEvent", {"type": "mousePressed", "x": point["x"], "y": point["y"], "button": "left", "clickCount": 1})
        await call("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": point["x"], "y": point["y"], "button": "left", "clickCount": 1})
        started = time.perf_counter()
        for target_time, name in [(0.25, "01-assembly-025"), (1.0, "02-assembly-100"), (1.8, "03-assembly-180"), (2.65, "04-core-265"), (3.4, "05-wordmark-340"), (3.95, "06-docking-395"), (4.65, "07-docked-465"), (5.3, "08-control-530"), (6.5, "09-control-650")]:
            await asyncio.sleep(max(0, target_time - (time.perf_counter() - started)))
            await shot(name)
        for form in ["network", "microphone", "guardian", "info", "clock", "modules"]:
            await call("Runtime.evaluate", {"expression": f"ORBITNeuralCore.morphTo('{form}',{{duration:500}})"})
            await asyncio.sleep(.7)
            await shot(f"morph-{form}")
        before_suspend = await call("Runtime.evaluate", {"expression": "ORBITNeuralCore.suspend(); JSON.stringify(ORBITNeuralCore.telemetry())", "returnByValue": True})
        await asyncio.sleep(.35)
        during_suspend = await call("Runtime.evaluate", {"expression": "JSON.stringify(ORBITNeuralCore.telemetry())", "returnByValue": True})
        resumed = await call("Runtime.evaluate", {"expression": "ORBITNeuralCore.resume(); true", "returnByValue": True})
        await asyncio.sleep(.35)
        after_resume = await call("Runtime.evaluate", {"expression": "JSON.stringify(ORBITNeuralCore.telemetry())", "returnByValue": True})
        print("lifecycle", before_suspend["result"]["value"], during_suspend["result"]["value"], resumed["result"]["value"], after_resume["result"]["value"])
        await call("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]})
        await call("Page.reload", {"ignoreCache": True})
        await asyncio.sleep(1)
        reduced = await call("Runtime.evaluate", {"expression": "JSON.stringify(ORBITNeuralCore.telemetry())", "returnByValue": True})
        print("reduced", reduced["result"]["value"])
        print("diagnostics", json.dumps(diagnostics, separators=(",", ":")))
        print("elapsed", round(time.perf_counter() - started, 3), "output", OUT)


if __name__ == "__main__":
    asyncio.run(main())
