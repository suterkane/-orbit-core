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

const envelope = new core.VoiceEnvelope({ attack: .07, hold: .12, release: .24 });
const attacked = envelope.step(1, .05);
assert.ok(attacked > .45 && attacked < 1, 'speech energy needs a fast but non-instant attack');
const held = envelope.step(0, .05);
assert.ok(held >= attacked * .98, 'short gaps between syllables must not collapse the visual presence');
for (let i = 0; i < 8; i++) envelope.step(0, .05);
assert.ok(envelope.value > 0 && envelope.value < held, 'speech energy needs a slower cinematic release');
assert.deepEqual(qualityChanges, ['balanced', 'low']);

const atlas = core.createMorphAtlas(320);
const morphRoles = core.createMorphRoles(320);
const roleCounts = [0, 0, 0];
for (const role of morphRoles) roleCounts[role]++;
assert.ok(roleCounts[0] > 115 && roleCounts[0] < 155, 'roughly 42% of particles must define the readable skeleton');
assert.ok(roleCounts[1] > 90 && roleCounts[1] < 130, 'roughly 35% of particles must carry energy flow');
assert.ok(roleCounts[2] > 55 && roleCounts[2] < 95, 'roughly 23% of particles must remain a free spatial field');
const guardianDepth = [0, 1, 2].map(role => {
  let total = 0, seen = 0;
  for (let i = 0; i < 320; i++) if (morphRoles[i] === role) { total += Math.abs(atlas.guardian[i * 3 + 2]); seen++; }
  return total / seen;
});
assert.ok(guardianDepth[0] < .08, 'guardian skeleton must remain front-readable');
assert.ok(guardianDepth[2] > .2, 'free guardian particles must preserve volumetric FRIDAY depth');
const networkPoints=Array.from({length:320},(_,i)=>[atlas.network[i*3],atlas.network[i*3+1],atlas.network[i*3+2]]);
const networkZ=networkPoints.map(point=>point[2]),networkR=networkPoints.map(point=>Math.hypot(...point));
assert.ok(Math.max(...networkZ)-Math.min(...networkZ)>1.15, 'network topology must occupy real front-to-back depth');
assert.ok(networkR.some(radius=>radius<.28)&&networkR.some(radius=>radius>.78), 'network topology needs both an inner intelligence nucleus and outer nodes');
assert.deepEqual(Object.keys(atlas), core.FORMS);
for (const form of core.FORMS) {
  assert.ok(atlas[form] instanceof Float32Array, `${form} must be a typed GPU attribute source`);
  assert.equal(atlas[form].length, 960, `${form} must preserve particle identity`);
  assert.ok([...atlas[form]].every(Number.isFinite), `${form} may not contain invalid coordinates`);
}
assert.notDeepEqual([...atlas.sphere.slice(0, 30)], [...atlas.microphone.slice(0, 30)]);
const glyphs={O:['111','101','101','101','111'],R:['110','101','110','101','101'],B:['110','101','110','101','110'],I:['111','010','010','010','111'],T:['111','010','010','010','010']};
const lit=[];let cursor=0;for(const ch of 'ORBIT'){for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyphs[ch][row][col]==='1')lit.push([(cursor+col-9.5)*.06,(2-row)*.108]);cursor+=4}
let skeletonGlyph=0,skeletonCount=0;for(let i=0;i<atlas.wordmark.length/3;i++)if(morphRoles[i]===0){skeletonCount++;const x=atlas.wordmark[i*3],y=atlas.wordmark[i*3+1];if(lit.some(([gx,gy])=>Math.hypot(x-gx,y-gy)<.078))skeletonGlyph++}
assert.ok(skeletonGlyph/skeletonCount>.95, 'wordmark skeleton must occupy lit ORBIT glyph cells');
assert.ok(Math.max(...Array.from({length:atlas.wordmark.length/3},(_,i)=>Math.abs(atlas.wordmark[i*3])))<1.12, 'wordmark field must fit the narrow iPhone camera frustum');
const sphereRadii=[];
for(let i=0;i<atlas.sphere.length;i+=3)sphereRadii.push(Math.hypot(atlas.sphere[i],atlas.sphere[i+1],atlas.sphere[i+2]));
assert.ok(sphereRadii.some(r=>r<.28), 'sphere requires a luminous inner nucleus');
assert.ok(sphereRadii.some(r=>r>.88), 'sphere requires an outer energy membrane');
const guardianSkeletonZ=Array.from({length:atlas.guardian.length/3},(_,i)=>morphRoles[i]===0?Math.abs(atlas.guardian[i*3+2]):0);
assert.ok(Math.max(...guardianSkeletonZ)<.12, 'guardian skeleton must remain a frontal readable helmet silhouette');
const microphoneSkeletonZ=Array.from({length:atlas.microphone.length/3},(_,i)=>morphRoles[i]===0?Math.abs(atlas.microphone[i*3+2]):0);
assert.ok(Math.max(...microphoneSkeletonZ)<.08, 'microphone skeleton must remain a frontal readable capsule silhouette');
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
assert.match(source, /glowShell\s*=\s*new THREE\.Mesh\s*\(\s*new THREE\.SphereGeometry/, 'core requires a lightweight volumetric Fresnel membrane');
assert.match(source, /fresnel/i, 'membrane shader must derive edge glow from Fresnel response');
assert.match(source, /haloSprite\s*=\s*new THREE\.Sprite/, 'core requires one soft billboard halo for depth');
assert.doesNotMatch(source, /ringGroup/, 'generic permanent HUD rings must be removed, not layered under the membrane');
assert.match(source, /shockwaveSlots\s*=\s*Array\.from\(\{length:2\}/, 'voice transients require exactly two reusable wave slots');
assert.match(source, /shockwaveMesh\s*=\s*new THREE\.Mesh/, 'both wave slots must share one GPU draw call');
assert.match(source, /renderCalls\s*:\s*renderer\.info\.render\.calls/, 'runtime telemetry must expose the real draw-call count');
assert.match(source, /cameraX\s*:\s*camera\.position\.x[\s\S]*cameraY\s*:\s*camera\.position\.y[\s\S]*cameraTargetX\s*:\s*parallax\.targetX/, 'runtime telemetry must separate parallax input from damped camera motion');
assert.match(source, /root\.addEventListener\s*\(\s*['"]pointermove['"]/, 'micro-parallax must use a bounded pointer input even though the canvas ignores pointer events');
assert.match(source, /root\.addEventListener\s*\(\s*['"]mousemove['"]\s*,\s*onPointerMove/, 'desktop and CDP mouse input must share the same bounded parallax bridge');
assert.match(source, /root\.removeEventListener\s*\(\s*['"]mousemove['"]\s*,\s*onPointerMove/, 'mouse fallback listener must be disposed');
assert.match(source, /1\s*-\s*Math\.exp\s*\(\s*-dt\s*\*\s*4\.5\s*\)/, 'micro-parallax damping must be frame-rate independent');
assert.match(source, /Math\.max\s*\(\s*-\.025\s*,\s*Math\.min\s*\(\s*\.025/, 'horizontal camera displacement must remain cinematic, not navigational');
assert.match(source, /if\s*\(reducedMotion\)\s*return/, 'reduced motion must disable pointer-driven camera movement');
assert.match(source, /root\.removeEventListener\s*\(\s*['"]pointermove['"]/, 'micro-parallax listeners must be disposed');
assert.match(source, /triggerShockwave\s*\(/, 'transient voice frames must be able to trigger a wave');
assert.doesNotMatch(source, /function render\([^]*?new THREE\.(?:Mesh|RingGeometry)/, 'render loop must never allocate shockwave geometry');
assert.match(source, /shockwaveGeometry\.dispose\s*\(\)[\s\S]*shockwaveMaterial\.dispose\s*\(\)/, 'pooled shockwave GPU resources must be disposed');
assert.match(source, /glowShell\.geometry\.dispose\s*\(\)[\s\S]*haloMaterial\.dispose\s*\(\)/, 'volumetric GPU resources must be disposed');
assert.match(source, /setAttribute\s*\(\s*['"]position['"]/, 'Three.js requires a canonical position attribute to issue the particle draw');
assert.match(source, /frustumCulled\s*=\s*false/, 'shader-morphed bounds must not be culled from stale CPU positions');
assert.match(source, /morphDuration\s*\+\s*hold/, 'morph hold must start after the morph completes');
assert.match(source, /element\.appendChild\(canvas\)/, 'settled core must be reparented into its Control Center dock');
assert.match(source, /neural-docked/, 'legacy radar must yield to the persistent Neural Core');
assert.match(source, /THREE\.ShaderMaterial/, 'morphing must be shader-driven');
assert.match(source, /attribute vec3 positionA[\s\S]*attribute vec3 positionB/);
assert.match(source, /setAttribute\s*\(\s*['"]morphRole['"]/, 'every particle needs a stable skeleton, flow, or free-field role');
assert.match(source, /morphRole\s*<\s*\.5[\s\S]*morphRole\s*<\s*1\.5/, 'morph roles must form three simultaneous particle populations');
assert.match(source, /sin\s*\(\s*delayed\s*\*\s*3\.14159\s*\)/, 'morph paths require a curved anticipation arc instead of direct-only interpolation');
assert.match(source, /freeField[\s\S]*flowField/, 'non-skeleton populations must retain visible post-morph motion');
assert.match(source, /uVoiceEnvelope\s*:\s*\{value:0\}/, 'the cinematic voice envelope requires one shared GPU control value');
assert.match(source, /voiceEnvelope\.step\s*\(\s*voiceEnvelopeTarget\s*,\s*dt\s*\)/, 'voice energy must pass through attack-hold-release once per frame');
assert.match(source, /shellUniforms[\s\S]*uVoiceEnvelope:uniforms\.uVoiceEnvelope/, 'the membrane must share the FRIDAY voice envelope');
assert.match(source, /connectionUniforms[\s\S]*uVoiceEnvelope:uniforms\.uVoiceEnvelope/, 'neural energy flow must share the FRIDAY voice envelope');
assert.match(source, /voiceEnvelope\s*:\s*uniforms\.uVoiceEnvelope\.value/, 'runtime telemetry must expose the visible speech presence');
assert.match(source, /uFieldMode\s*:\s*\{value:0\}/, 'network and wordmark readability need a shader-side population hierarchy');
assert.match(source, /form\s*===\s*['"]network['"]\s*\?\s*1\s*:\s*form\s*===\s*['"]wordmark['"]\s*\?\s*2\s*:\s*0/, 'wordmark must activate its own visual hierarchy instead of equal-weight field particles');
assert.match(source, /wordmarkWeight\s*=\s*morphRole\s*<\s*\.5\s*\?\s*1\.7/, 'wordmark skeleton must dominate its flow and free field populations');
assert.match(source, /morphForm\s*===\s*['"]network['"]\s*\?\s*\.22/, 'network filaments need a stronger but bounded connection target');
assert.match(source, /morphRole\s*<\s*\.5\s*\?\s*1\.35[\s\S]*morphRole\s*<\s*1\.5/, 'network nodes, flow, and free field must have distinct visual weights');
assert.match(source, /mix\s*\(positionA\s*,\s*positionB/);
assert.doesNotMatch(source, /attributes\.position\.needsUpdate\s*=\s*true/, 'render loop must not upload CPU positions');
assert.doesNotMatch(source, /getBoundingClientRect\([^)]*\)[\s\S]{0,500}requestAnimationFrame/, 'layout reads may not occur in the frame loop');
assert.equal(core.TIER.reduced.connections, 0);
assert.equal(core.TIER.low.connections, 0);
assert.match(source, /new THREE\.LineSegments\s*\(/, 'connections must use one batched GPU draw');
assert.doesNotMatch(source, /new THREE\.LineLoop\s*\(/, 'perfect orbital HUD rings must not compete with the organic membrane');
assert.match(source, /connectionMaterial\s*=\s*new THREE\.ShaderMaterial/, 'connections must be shader driven');
assert.match(source, /setAttribute\s*\(\s*['"]lineT['"]/, 'connection vertices need a stable along-line coordinate');
assert.match(source, /setAttribute\s*\(\s*['"]pulsePhase['"]/, 'connections need deterministic energy phases');
assert.match(source, /uPulseSpeed[\s\S]*uPulseWidth[\s\S]*uPulseStrength/, 'connection shader must animate bounded energy impulses');
assert.match(source, /fract\s*\(uTime\s*\*\s*uPulseSpeed\s*\+\s*vPulsePhase\s*\)/, 'energy must travel along the existing connection draw call');
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
const styles = fs.readFileSync(path.join(app, 'styles.css'), 'utf8');
assert.doesNotMatch(sw, /orbit-cinematic-boot|boot-sequence/, 'inactive score and reactor must not be precached');
assert.doesNotMatch(sw, /handoff\.(?:js|css)/, 'disconnected legacy handoff assets must not remain in the offline package');
assert.match(sw, /CACHE\s*=\s*['"]orbit-neural-core-v2-presence-r7['"]/, 'voice release must invalidate the previous service-worker cache');
for(const ref of ['styles.css?v=6','start-v2.css?v=21','neural-core-v2.js?v=7','start-v2.js?v=20'])assert.ok(html.includes(`"${ref}"`), `canonical entry must use fresh cinematic asset ${ref}`);
for(const ref of [...html.matchAll(/(?:src|href)="([^"]+\?v=\d+)"/g)].map(match=>match[1]))assert.ok(sw.includes(`'${ref}'`), `service worker must precache versioned HTML dependency ${ref}`);
assert.match(css, /\.friday-orb\s*\{[^}]*display\s*:\s*none/s, 'legacy CSS orb must not compete with the GPU core');
assert.doesNotMatch(html, /class="splash-frame"|class="friday-title"/, 'legacy framed title composition must not dominate Neural Core V2');
assert.match(html, /class="neural-stage"/, 'start screen must be composed around the neural presence');
assert.match(css, /\.friday-hologram\{[^}]*z-index:1/s, 'GPU core must be the visible foreground presence');
assert.match(css, /\.app\.handoff-underlay\s*\{[^}]*position\s*:\s*fixed[^}]*inset\s*:\s*0/s, 'control center handoff underlay must occupy the viewport');
assert.match(css, /\.splash\.handoff-out\s*\{[^}]*opacity\s*:\s*0/s, 'splash must crossfade away while the persistent core docks');
assert.match(styles, /--orbit-canvas\s*:\s*#02070a[\s\S]*--orbit-system\s*:\s*#00e5ff[\s\S]*--orbit-priority\s*:\s*#ff9500/, 'control center requires the same navy, cyan, and orange identity as the neural core');
assert.match(styles, /\.hud-hero\s*\{[^}]*var\(--orbit-panel\)[^}]*var\(--orbit-system\)/s, 'hero must use the neural command surface instead of the legacy red-brown reactor palette');
assert.match(styles, /\.metric\s*,\s*\.integration-card\s*,\s*\.focus-card\s*,\s*\.capture-card\s*\{[^}]*var\(--orbit-border\)/s, 'dashboard surfaces must share one subtle command border');
assert.doesNotMatch(start, /void startBootMusic\s*\(/, 'continuous score must not be in the active start path');
assert.match(start, /ORBITNeuralCore\.assemble\s*\(/, 'initiate must start particle assembly');
assert.match(start, /HANDOFF_DELAY\s*=\s*(?:3[5-9]\d\d|[4-9]\d{3,})/, 'handoff must leave the completed wordmark visible');
assert.match(start, /ORBITNeuralCore\.pushVoiceFrame/);
assert.doesNotMatch(start, /voiceDone&&bootDone/, 'visual handoff must not wait for a long voice service');

const legacyEntry = fs.readFileSync(path.join(app, 'friday-simple.html'), 'utf8');
assert.match(legacyEntry, /location\.replace\s*\(\s*['"]\.\/index\.html['"]\s*\)/, 'legacy friday-simple URL must open the canonical ORBIT app');
assert.doesNotMatch(legacyEntry, /TorusGeometry|friday-theme|cdnjs/, 'legacy entry must not retain the rejected standalone demo');

console.log('Neural Core V2 architecture contracts passed');
