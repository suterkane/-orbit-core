const assert = require('node:assert/strict');
const { AUDIO_MIX } = require('../interface/app/audio-mix.js');

assert.equal(AUDIO_MIX.synthetic, 0.31);
assert.equal(AUDIO_MIX.private, 0.42);
assert.equal(AUDIO_MIX.ducked, 0.14);
assert.ok(AUDIO_MIX.ducked < AUDIO_MIX.synthetic / 2, 'voice ducking must keep FRIDAY clear');
assert.ok(AUDIO_MIX.private <= 0.45, 'music must not overpower speech');
console.log('5 cinematic audio mix tests passed');
