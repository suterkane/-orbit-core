const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = path.join(__dirname, '..', 'interface', 'app');
const corePath = path.join(app, 'neural-core-v2.js');
const startPath = path.join(app, 'start-v2.js');
const core = require(corePath);

class Param {
  constructor(value = 0) { this.value = value; this.events = []; }
  cancelScheduledValues(t) { this.events.push(['cancel', t]); }
  setValueAtTime(v, t) { this.value = v; this.events.push(['set', v, t]); }
  linearRampToValueAtTime(v, t) { this.value = v; this.events.push(['linear', v, t]); }
  exponentialRampToValueAtTime(v, t) { this.value = v; this.events.push(['exponential', v, t]); }
}
class Node {
  constructor() { this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); this.started = []; this.stopped = []; }
  connect(target) { this.target = target; return target; }
  start(t) { this.started.push(t); }
  stop(t) { this.stopped.push(t); }
}
class FakeAudioContext {
  constructor() { FakeAudioContext.instances.push(this); this.currentTime = 10; this.state = 'suspended'; this.destination = new Node(); this.oscillators = []; }
  resume() { this.state = 'running'; this.resumed = true; return Promise.resolve(); }
  createGain() { return new Node(); }
  createBiquadFilter() { return new Node(); }
  createOscillator() { const node = new Node(); this.oscillators.push(node); return node; }
}
FakeAudioContext.instances = [];

const root = { AudioContext: FakeAudioContext };
const sound = new core.NeuralCoreSound(root);
assert.equal(FakeAudioContext.instances.length, 0, 'AudioContext must remain lazy before the user gesture');
assert.equal(sound.unlock(), true, 'unlock must synchronously create/resume the local AudioContext');
assert.equal(FakeAudioContext.instances.length, 1);
assert.equal(FakeAudioContext.instances[0].resumed, true);
assert.equal(sound.unlock(), true, 'repeated unlock reuses the same context');
assert.equal(FakeAudioContext.instances.length, 1);
assert.deepEqual(sound.telemetry(), {state:'running',voiceActive:false,lastCue:'',tonesStarted:0,masterGain:.18}, 'sound telemetry exposes real context state before playback');

assert.equal(sound.cue('assembling'), true, 'assembly has a short audible rise');
const ctx = FakeAudioContext.instances[0];
assert.ok(ctx.oscillators.length >= 2, 'assembly rise is layered but finite');
assert.ok(ctx.oscillators.every(o => o.stopped.length === 1), 'every assembly oscillator has a scheduled stop');
const afterAssembly = ctx.oscillators.length;
for (const state of ['listening', 'thinking', 'confirm', 'error']) {
  assert.equal(sound.cue(state), true, `${state} has a one-shot morph cue`);
  assert.ok(ctx.oscillators.length > afterAssembly, `${state} creates finite local synthesis`);
}
assert.ok(ctx.oscillators.every(o => o.stopped.length === 1), 'morph cues never loop indefinitely');
assert.equal(sound.telemetry().tonesStarted, ctx.oscillators.length, 'telemetry counts every actually started oscillator');
const beforeRepeat = ctx.oscillators.length;
assert.equal(sound.cue('error'), false, 'same state does not retrigger a cue');
assert.equal(ctx.oscillators.length, beforeRepeat);
sound.setVoiceActive(true);
assert.equal(sound.telemetry().masterGain, .0001, 'voice ducking reaches the near-silent gain target');
assert.equal(sound.cue('listening'), false, 'voice has priority and suppresses state cues');
sound.setVoiceActive(false);
assert.equal(sound.cue('listening'), true, 'cue becomes available after voice ends');

const source = fs.readFileSync(corePath, 'utf8');
const start = fs.readFileSync(startPath, 'utf8');
assert.doesNotMatch(source, /setInterval\s*\(/, 'Neural Core sound may not create loops');
assert.match(source, /sound\.cue\s*\(machine\.state\)/, 'visual state transitions drive sound transitions');
assert.match(source, /sound\.setVoiceActive/, 'voice activity is explicitly prioritized');
const launchBody = start.match(/async function launchWithVoice\([^]*?(?=\n\s*window\.ORBITFriday)/);
assert.ok(launchBody, 'launch handler exists');
assert.match(launchBody[0], /unlockAudio\(\)[^]*?assemble\(\)/, 'AudioContext unlock happens in the initiate handler before assembly');
assert.doesNotMatch(launchBody[0], /startBootMusic\s*\(/, 'rejected continuous score remains outside the active path');

console.log('Neural Core reactive one-shot sound contracts passed');
