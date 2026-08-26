const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const appDir = path.join(__dirname, '..', 'interface', 'app');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(appDir, 'app.js'), 'utf8');
const voice = fs.readFileSync(path.join(appDir, 'voice-core.js'), 'utf8');
const sw = fs.readFileSync(path.join(appDir, 'service-worker.js'), 'utf8');
const manifest = fs.readFileSync(path.join(appDir, 'manifest.webmanifest'), 'utf8');
const pullCloudSource = app.slice(app.indexOf('async function pullCloud'), app.indexOf('async function connectSync'));

const stateIndex = html.indexOf('companion-state.js?v=1');
const runtimeIndex = html.indexOf('companion-runtime.js?v=1');
const syncIndex = html.indexOf('companion-sync.js?v=1');
const appIndex = html.indexOf('app.js?v=13');
assert.ok(stateIndex >= 0 && stateIndex < runtimeIndex && runtimeIndex < syncIndex && syncIndex < appIndex, 'companion scripts must load before app.js in dependency order');
assert.match(html, /id="deviceStatus"/);
assert.match(html, /id="handoffBtn"/);
assert.match(html, /Mission 21 · ORBIT Companion V1/);
assert.doesNotMatch(manifest, /"orientation"\s*:\s*"portrait-primary"/);

assert.match(app, /createCompanionRuntime\s*\(/);
assert.match(app, /createCompanionSyncAdapter\s*\(/);
assert.match(app, /companionSync\.pack\(entries\)/, 'cloud POST must include the companion envelope');
assert.match(app, /companionSync\.ingest\(state\.entries\)/, 'cloud GET must strip and merge the companion envelope');
assert.doesNotMatch(pullCloudSource, /if\(incoming\.entries\.length\)/, 'an intentionally empty remote task list must clear local tasks');
assert.match(app, /companionRuntime\.updateShared\(\{activeView:id\}\)/, 'view changes must be shared');
assert.match(app, /companionRuntime\.requestHandoff\(/, 'the visible handoff control must emit a targeted handoff');
assert.match(app, /if\(pending\)\{companionRuntime\.acknowledgeHandoff\(pending\.id\);setView\(pending\.route,\{share:false\}\)\}/, 'target must acknowledge before opening the handoff route without recursive sharing');
assert.match(app, /document\.addEventListener\('visibilitychange',[\s\S]*companionRuntime\?\.heartbeat\(document\.visibilityState==='hidden'\?'offline':'online'\)/, 'visibility changes must update presence immediately');
assert.match(app, /window\.addEventListener\('offline',[\s\S]*companionRuntime\?\.heartbeat\('offline'\)/, 'network loss must mark the device offline immediately');
assert.match(app, /window\.addEventListener\('online',[\s\S]*companionRuntime\?\.heartbeat\('online'\)/, 'network recovery must restore presence immediately');
assert.doesNotMatch(app, /updateShared\([^)]*syncKey/s, 'sync key must never enter companion state');
assert.match(voice, /const sharedState=next==='replying'\?'speaking':next[\s\S]*ORBITCompanion\?\.updateShared\(\{voice:\{state:sharedState\}\}\)/, 'voice UI replying state must map to protocol speaking state');
assert.match(voice, /ORBITCompanion\?\.updateShared\(\{conversation:/, 'completed dialogue turns must be shared');

for(const asset of ['companion-state.js?v=1','companion-runtime.js?v=1','companion-sync.js?v=1','app.js?v=13','voice-core.js?v=5'])assert.ok(sw.includes(`'${asset}'`), `${asset} must be precached`);
assert.match(sw, /orbit-neural-core-v2-panorama-r13/);

console.log('ORBIT Companion browser integration contracts passed');
