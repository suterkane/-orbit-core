import wave
from pathlib import Path
import numpy as np

RATE = 44100
DURATION = 36.0
N = int(RATE * DURATION)
t = np.arange(N, dtype=np.float64) / RATE
rng = np.random.default_rng(2042)

# Original ORBIT cue: dark D-minor drone, reactor pulse, cyan shimmer.
left = np.zeros(N)
right = np.zeros(N)
fade_in = np.clip(t / 2.4, 0, 1)
fade_out = np.clip((DURATION - t) / 3.0, 0, 1)
envelope = fade_in * fade_out

for freq, amp, drift in [(73.42, .34, .08), (110.0, .20, .05), (146.83, .12, .04), (174.61, .07, .03)]:
    phase = 2 * np.pi * freq * t + drift * np.sin(2 * np.pi * .07 * t)
    left += amp * np.sin(phase)
    right += amp * np.sin(phase + .045)

# 87 BPM reactor pulse, every second beat emphasized.
beat = 60 / 87
for i, start in enumerate(np.arange(0, DURATION, beat)):
    idx = (t >= start) & (t < start + .42)
    x = t[idx] - start
    punch = np.sin(2 * np.pi * (58 - 22 * x) * x) * np.exp(-8.5 * x)
    level = .34 if i % 4 == 0 else .19
    left[idx] += level * punch
    right[idx] += level * punch

# Sparse original eight-note signal motif.
notes = [293.66, 349.23, 440.0, 392.0, 329.63, 293.66, 261.63, 293.66]
for i, start in enumerate(np.arange(1.8, DURATION - 1, beat * 2)):
    freq = notes[i % len(notes)]
    idx = (t >= start) & (t < start + 1.15)
    x = t[idx] - start
    note_env = np.minimum(x / .08, 1) * np.exp(-2.9 * x)
    tone = np.sin(2 * np.pi * freq * x) + .22 * np.sin(2 * np.pi * freq * 2 * x)
    pan = .5 + .35 * np.sin(i * 1.7)
    left[idx] += .105 * tone * note_env * (1 - pan / 2)
    right[idx] += .105 * tone * note_env * (.5 + pan / 2)

# High air, kept subtle under speech.
noise = rng.normal(0, 1, N)
air = np.concatenate(([0], np.diff(noise)))
air *= .006 * (1 + .35 * np.sin(2 * np.pi * .11 * t))
left += air
right += np.roll(air, 73)

left *= envelope
right *= envelope
stereo = np.stack([left, right], axis=1)
peak = np.max(np.abs(stereo))
stereo = np.tanh(stereo * (1.35 / peak)) * .82
pcm = (stereo * 32767).astype('<i2')

out = Path('interface/app/assets/orbit-cinematic-boot.wav')
out.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out), 'wb') as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes(pcm.tobytes())
print(out, out.stat().st_size)
