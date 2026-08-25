const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = path.join(__dirname, '..', 'interface', 'app');
const css = fs.readFileSync(path.join(app, 'boot-sequence.css'), 'utf8');
const js = fs.readFileSync(path.join(app, 'boot-sequence.js'), 'utf8');

assert.doesNotMatch(css, /\.friday-boot-hud\{[^}]*z-index:-1/, 'boot HUD must not render behind the interface');
assert.match(css, /\.friday-core-wrap\.boot-running \.friday-boot-hud\{[^}]*z-index:4/, 'running boot HUD must be in the visible foreground');
assert.match(js, /animateProgress\(7200\)/, 'cinematic assembly must be long enough to read');
assert.match(js, /CORE ASSEMBLY/, 'boot must expose a visible assembly phase');
const appJs = fs.readFileSync(path.join(app, 'app.js'), 'utf8');
assert.doesNotMatch(appJs, /initiateBtn'\)\.onclick=showApp/, 'legacy click handler must not bypass the cinematic boot');
const startJs = fs.readFileSync(path.join(app, 'start-v2.js'), 'utf8');
assert.doesNotMatch(startJs, /await startBootMusic\(\)/, 'audio startup must never block the visual assembly');
assert.match(startJs, /void startBootMusic\(\)/, 'music and visual assembly must start together');
console.log('7 cinematic boot visibility tests passed');
