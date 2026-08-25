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
assert.match(bootSource, /assets\/orbit-cinematic-boot\.ogg/, 'boot must prefer bundled music');
const score = path.join(appDir, 'assets', 'orbit-cinematic-boot.ogg');
assert.ok(fs.existsSync(score), 'bundled cinematic score must exist');
assert.ok(fs.statSync(score).size > 100000, 'bundled score must contain real audio');
console.log('8 cinematic audio tests passed');
