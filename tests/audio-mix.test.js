const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { AUDIO_MIX } = require('../interface/app/audio-mix.js');

assert.equal(AUDIO_MIX.synthetic, 0.31);
assert.equal(AUDIO_MIX.private, 0.42);
assert.equal(AUDIO_MIX.ducked, 0.14);
assert.ok(AUDIO_MIX.ducked < AUDIO_MIX.synthetic / 2, 'voice ducking must keep FRIDAY clear');
assert.ok(AUDIO_MIX.private <= 0.45, 'music must not overpower speech');

const appDir = path.join(__dirname, '..', 'interface', 'app');
const bootSource = fs.readFileSync(path.join(appDir, 'start-v2.js'), 'utf8');
assert.match(bootSource, /assets\/orbit-cinematic-boot\.m4a/, 'iPhone Safari must receive bundled AAC/M4A music');
assert.doesNotMatch(bootSource, /orbit-cinematic-boot\.ogg/, 'Safari music path must not use OGG/Opus');
const score = path.join(appDir, 'assets', 'orbit-cinematic-boot.m4a');
assert.ok(fs.existsSync(score), 'bundled Safari-compatible score must exist');
assert.ok(fs.statSync(score).size > 100000, 'bundled score must contain real audio');
const worker = fs.readFileSync(path.join(appDir, 'service-worker.js'), 'utf8');
assert.match(worker, /assets\/orbit-cinematic-boot\.m4a/, 'startup score must be available offline');
assert.match(bootSource, /audio\.loop=true/, 'cinematic score must loop until FRIDAY finishes speaking');
assert.match(bootSource, /MUSIC_MAX_MS=90000/, 'cinematic score must run the full 90s briefing duration');
assert.match(bootSource, /void startBootMusic\(\)/, 'score starts from the trusted initiate gesture');
assert.match(bootSource, /setMusicLevel\(active\?AUDIO_MIX\.ducked:AUDIO_MIX\.handoff/, 'FRIDAY speech must duck the score');
assert.match(bootSource, /LOCAL_VOICE_RATE=1\.12/, 'local FRIDAY voice must use the faster approved cadence');
assert.match(bootSource, /activeAudio\.playbackRate=LOCAL_VOICE_RATE/, 'local neural playback must apply the faster cadence');
assert.match(bootSource, /activeAudio\.preservesPitch=true/, 'speed-up must preserve FRIDAY pitch');
assert.match(bootSource, /rate:1\.08/, 'browser fallback must not revert to the old slow cadence');
console.log('15 optional audio isolation tests passed');
