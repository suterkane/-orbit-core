const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = path.join(__dirname, '..', 'interface', 'app');
const html = fs.readFileSync(path.join(app, 'index.html'), 'utf8');
const start = fs.readFileSync(path.join(app, 'start-v2.js'), 'utf8');
const appJs = fs.readFileSync(path.join(app, 'app.js'), 'utf8');

assert.doesNotMatch(html, /boot-sequence\.(?:js|css)/, 'rejected DOM reactor must be disconnected');
assert.doesNotMatch(html, /handoff\.(?:js|css)/, 'persistent core handoff must have exactly one timing owner');
assert.match(html, /neural-core-v2\.js/, 'GPU core owns boot assembly');
assert.match(start, /ORBITNeuralCore\.assemble\(\)/, 'particle assembly starts from the accessible initiate action');
assert.match(start, /HANDOFF_DELAY\s*=\s*(?:3[5-9]\d\d|[4-9]\d{3,})/, 'handoff waits for assembly plus a readable completed morph');
assert.match(start, /setTimeout\(launchApp,HANDOFF_DELAY\)/, 'handoff uses the reviewed delay contract');
assert.match(start, /app\.classList\.add\(['"]handoff-underlay['"]\)/, 'control center must become a visible underlay before docking');
assert.match(start, /splash\.classList\.add\(['"]handoff-out['"]\)/, 'splash must crossfade instead of remaining empty');
assert.ok(start.indexOf("app.classList.add('handoff-underlay')") < start.indexOf('ORBITNeuralCore?.dockTo'), 'underlay must be established before the core starts docking');
assert.doesNotMatch(start, /void startBootMusic\(\)/, 'continuous music is not started by initiate');
assert.doesNotMatch(appJs, /initiateBtn'\)\.onclick=showApp/, 'legacy click handler must not bypass assembly');
console.log('6 Neural Core boot handoff tests passed');
