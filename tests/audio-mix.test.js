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
assert.doesNotMatch(worker, /assets\/orbit-cinematic-boot\.m4a/, 'inactive score must not create a startup request');
assert.doesNotMatch(bootSource, /void startBootMusic\(\)/, 'score remains optional and outside the active initiate path');
console.log('11 optional audio isolation tests passed');
