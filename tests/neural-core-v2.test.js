const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = path.join(__dirname, '..', 'interface', 'app');
const corePath = path.join(app, 'neural-core-v2.js');
const core = require(corePath);

assert.deepEqual(core.FORMS, ['sphere','wordmark','network','microphone','guardian','info','clock','modules']);
assert.deepEqual(core.STATES, ['dormant','assembling','idle','listening','thinking','speaking','confirm','error','docking','suspended']);
assert.equal(core.PARTICLE_BUDGET.balanced, 3200);
assert.ok(core.STATE_TARGETS.dormant.brightness >= .35, 'dormant seeds must remain visibly present');
assert.equal(core.resolveQuality({ reducedMotion: true }), 'reduced');
assert.equal(core.resolveQuality({ reducedMotion: false, width: 390, dpr: 3, hardwareConcurrency: 6 }), 'balanced');
assert.equal(core.resolveQuality({ reducedMotion: false, width: 1440, dpr: 1, hardwareConcurrency: 8 }), 'high');
assert.ok(core.ASSEMBLY_DURATION >= 2200 && core.ASSEMBLY_DURATION <= 3200);

// Runtime quality only degrades after sustained slow frames, then observes a cooldown.
const qualityChanges = [];
const governor = new core.RuntimeQualityGovernor('high', tier => qualityChanges.push(tier), {
  slowFrameMs: 20,
  slowFrames: 3,
  recoveryFrames: 2
});
governor.sample(21); governor.sample(21);
assert.equal(governor.quality, 'high', 'brief frame-time spikes must not degrade quality');
governor.sample(21);
assert.equal(governor.quality, 'balanced', 'sustained slow frames must degrade by one tier');
governor.sample(50); governor.sample(50);
assert.equal(governor.quality, 'balanced', 'hysteresis cooldown must prevent immediate repeated degradation');
governor.sample(10); governor.sample(10);
governor.sample(21); governor.sample(21); governor.sample(21);
assert.equal(governor.quality, 'low', 'a fresh sustained regression may degrade again after recovery');
for (let i = 0; i < 100; i++) governor.sample(5);
assert.equal(governor.quality, 'low', 'runtime quality must never automatically upgrade during a session');
assert.deepEqual(qualityChanges, ['balanced', 'low']);

const atlas = core.createMorphAtlas(320);
assert.deepEqual(Object.keys(atlas), core.FORMS);
for (const form of core.FORMS) {
  assert.ok(atlas[form] instanceof Float32Array, `${form} must be a typed GPU attribute source`);
  assert.equal(atlas[form].length, 960, `${form} must preserve particle identity`);
  assert.ok([...atlas[form]].every(Number.isFinite), `${form} may not contain invalid coordinates`);
}
assert.notDeepEqual([...atlas.sphere.slice(0, 30)], [...atlas.microphone.slice(0, 30)]);
const glyphs={O:['111','101','101','101','111'],R:['110','101','110','101','101'],B:['110','101','110','101','110'],I:['111','010','010','010','111'],T:['111','010','010','010','010']};
const lit=[];let cursor=0;for(const ch of 'ORBIT'){for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyphs[ch][row][col]==='1')lit.push([(cursor+col-9.5)*.06,(2-row)*.108]);cursor+=4}
let onGlyph=0;for(let i=0;i<atlas.wordmark.length;i+=3){const x=atlas.wordmark[i],y=atlas.wordmark[i+1];if(lit.some(([gx,gy])=>Math.hypot(x-gx,y-gy)<.078))onGlyph++}
assert.ok(onGlyph/(atlas.wordmark.length/3)>.95, 'wordmark particles must occupy lit ORBIT glyph cells, not the full background grid');
assert.ok(Math.max(...Array.from({length:atlas.wordmark.length/3},(_,i)=>Math.abs(atlas.wordmark[i*3])))<.88, 'wordmark must fit the narrow iPhone camera frustum');
const sphereRadii=[];
for(let i=0;i<atlas.sphere.length;i+=3)sphereRadii.push(Math.hypot(atlas.sphere[i],atlas.sphere[i+1],atlas.sphere[i+2]));
assert.ok(sphereRadii.some(r=>r<.28), 'sphere requires a luminous inner nucleus');
assert.ok(sphereRadii.some(r=>r>.88), 'sphere requires an outer energy membrane');
const guardianZ=Array.from({length:atlas.guardian.length/3},(_,i)=>Math.abs(atlas.guardian[i*3+2]));
assert.ok(Math.max(...guardianZ)<.12, 'guardian must remain a frontal readable helmet silhouette');
const microphoneZ=Array.from({length:atlas.microphone.length/3},(_,i)=>Math.abs(atlas.microphone[i*3+2]));
assert.ok(Math.max(...microphoneZ)<.08, 'microphone must remain a frontal readable capsule silhouette');
const infoOuter=Array.from({length:atlas.info.length/3},(_,i)=>Math.hypot(atlas.info[i*3],atlas.info[i*3+1])).filter(r=>r>.82);
assert.ok(infoOuter.length>atlas.info.length/12, 'info form requires a clearly populated outer energy ring');
assert.deepEqual([...core.createMorphAtlas(32).guardian], [...core.createMorphAtlas(32).guardian], 'atlas generation must be deterministic');

const machine = new core.CoreStateMachine();
assert.equal(machine.state, 'dormant');
assert.equal(machine.setState('listening'), true);
assert.equal(machine.state, 'listening');
assert.equal(machine.targets.form, 'microphone');
assert.equal(machine.setState('bogus'), false);
assert.equal(machine.state, 'listening');

const source = fs.readFileSync(corePath, 'utf8');
assert.match(source, /new THREE\.Points\s*\(/, 'one persistent Points field must render the core');
assert.match(source, /setAttribute\s*\(\s*['"]position['"]/, 'Three.js requires a canonical position attribute to issue the particle draw');
assert.match(source, /frustumCulled\s*=\s*false/, 'shader-morphed bounds must not be culled from stale CPU positions');
assert.match(source, /morphDuration\s*\+\s*hold/, 'morph hold must start after the morph completes');
assert.match(source, /element\.appendChild\(canvas\)/, 'settled core must be reparented into its Control Center dock');
assert.match(source, /neural-docked/, 'legacy radar must yield to the persistent Neural Core');
assert.match(source, /THREE\.ShaderMaterial/, 'morphing must be shader-driven');
assert.match(source, /attribute vec3 positionA[\s\S]*attribute vec3 positionB/);
assert.match(source, /mix\s*\(positionA\s*,\s*positionB/);
assert.doesNotMatch(source, /attributes\.position\.needsUpdate\s*=\s*true/, 'render loop must not upload CPU positions');
assert.doesNotMatch(source, /getBoundingClientRect\([^)]*\)[\s\S]{0,500}requestAnimationFrame/, 'layout reads may not occur in the frame loop');
assert.equal(core.TIER.reduced.connections, 0);
assert.equal(core.TIER.low.connections, 0);
assert.match(source, /new THREE\.LineSegments\s*\(/, 'connections must use one batched GPU draw');
assert.match(source, /new THREE\.LineLoop\s*\(/, 'the living core requires true WebGL orbital rings');
assert.match(source, /connectionMaterial\s*=\s*new THREE\.ShaderMaterial/, 'connections must be shader driven');
assert.match(source, /ICON_FORMS\.has\(morphForm\)\s*\?\s*0/, 'connections must not overdraw readable symbol silhouettes');
assert.match(source, /morphForm\s*===\s*['"]wordmark['"]\s*\?\s*\.008/, 'wordmark must suppress radial turbulence');
assert.match(source, /particles\.rotation\.y\s*\+=\s*\(0-particles\.rotation\.y\)/, 'wordmark must settle to a frontal reading angle');
assert.match(source, /connectionGeometry\.dispose\s*\(\)/, 'connection GPU resources must be disposed');
assert.match(source, /new RuntimeQualityGovernor\s*\(/, 'the frame loop must use runtime quality governance');
assert.match(source, /governor\.sample\s*\(/, 'rendered frame times must feed the governor');
assert.doesNotMatch(source, /function render\([^)]*\)[\s\S]*connectionGeometry\.getAttribute[^}]*\.needsUpdate/, 'connection positions must not be uploaded from CPU per frame');
assert.match(source, /webglcontextlost/);
assert.match(source, /webglcontextrestored/);
assert.match(source, /visibilitychange/);
assert.match(source, /pagehide/);
assert.match(source, /pageshow/);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /setState\s*\(/);
assert.match(source, /morphTo\s*\(/);
assert.match(source, /pushVoiceFrame\s*\(/);
assert.match(source, /telemetry\s*:\s*\(\)\s*=>/, 'runtime telemetry must expose the real render state for verification');
assert.match(source, /averageFrameMs/, 'runtime telemetry must expose measured frame pacing');
assert.match(source, /dockTo\s*\(/);

const html = fs.readFileSync(path.join(app, 'index.html'), 'utf8');
assert.match(html, /<meta name="mobile-web-app-capable" content="yes"\s*\/?>/, 'modern installable-PWA capability meta must accompany the Apple compatibility meta');
assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/, 'favicon must be embedded to avoid an uncached network request');
assert.match(html, /neural-core-v2\.js/);
assert.doesNotMatch(html, /friday-hologram\.js/);
assert.doesNotMatch(html, /boot-sequence\.js|boot-sequence\.css/, 'rejected DOM boot reactor must be inactive');
const start = fs.readFileSync(path.join(app, 'start-v2.js'), 'utf8');
const sw = fs.readFileSync(path.join(app, 'service-worker.js'), 'utf8');
const css = fs.readFileSync(path.join(app, 'start-v2.css'), 'utf8');
assert.doesNotMatch(sw, /orbit-cinematic-boot|boot-sequence/, 'inactive score and reactor must not be precached');
for(const ref of [...html.matchAll(/(?:src|href)="([^"]+\?v=\d+)"/g)].map(match=>match[1]))assert.ok(sw.includes(`'${ref}'`), `service worker must precache versioned HTML dependency ${ref}`);
assert.match(css, /\.friday-orb\s*\{[^}]*display\s*:\s*none/s, 'legacy CSS orb must not compete with the GPU core');
assert.doesNotMatch(html, /class="splash-frame"|class="friday-title"/, 'legacy framed title composition must not dominate Neural Core V2');
assert.match(html, /class="neural-stage"/, 'start screen must be composed around the neural presence');
assert.match(css, /\.friday-hologram\{[^}]*z-index:1/s, 'GPU core must be the visible foreground presence');
assert.doesNotMatch(start, /void startBootMusic\s*\(/, 'continuous score must not be in the active start path');
assert.match(start, /ORBITNeuralCore\.assemble\s*\(/, 'initiate must start particle assembly');
assert.match(start, /HANDOFF_DELAY\s*=\s*(?:3[5-9]\d\d|[4-9]\d{3,})/, 'handoff must leave the completed wordmark visible');
assert.match(start, /ORBITNeuralCore\.pushVoiceFrame/);
assert.doesNotMatch(start, /voiceDone&&bootDone/, 'visual handoff must not wait for a long voice service');

const legacyEntry = fs.readFileSync(path.join(app, 'friday-simple.html'), 'utf8');
assert.match(legacyEntry, /location\.replace\s*\(\s*['"]\.\/index\.html['"]\s*\)/, 'legacy friday-simple URL must open the canonical ORBIT app');
assert.doesNotMatch(legacyEntry, /TorusGeometry|friday-theme|cdnjs/, 'legacy entry must not retain the rejected standalone demo');

console.log('Neural Core V2 architecture contracts passed');
