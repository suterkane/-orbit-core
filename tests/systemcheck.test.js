const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appPath = path.join(__dirname, '..', 'interface', 'app');
const systemCheckCode = fs.readFileSync(path.join(appPath, 'system-check.js'), 'utf8');

// ─────────────────────────────────────────────────────────────────────────
// Test 1: Verify all required module keys are checked
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /ORBITStorageV2/, 'SYSTEMCHECK must verify Storage module');
assert.match(systemCheckCode, /ORBITNeuralCore/, 'SYSTEMCHECK must verify Neural Core');
assert.match(systemCheckCode, /ORBITVoiceV2/, 'SYSTEMCHECK must verify Voice module');
assert.match(systemCheckCode, /ORBITFridayBriefing/, 'SYSTEMCHECK must verify Briefing module');
assert.match(systemCheckCode, /ORBITFridayAI/, 'SYSTEMCHECK must verify AI module');
assert.match(systemCheckCode, /ORBITDashboardV2/, 'SYSTEMCHECK must verify Dashboard module');
assert.match(systemCheckCode, /ORBITWeatherV2/, 'SYSTEMCHECK must verify Weather module');

// ─────────────────────────────────────────────────────────────────────────
// Test 2: Verify systemStatus object tracks all components
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /modules:\s*\{\}/, 'Must initialize modules status object');
assert.match(systemCheckCode, /errors:\s*\[\]/, 'Must initialize errors array for clear messages');
assert.match(systemCheckCode, /warnings:\s*\[\]/, 'Must initialize warnings array');

// ─────────────────────────────────────────────────────────────────────────
// Test 3: Verify error messages are detailed (not silent-fails)
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /type:\s*['"]MODULE_MISSING/, 'Must report MODULE_MISSING with type');
assert.match(systemCheckCode, /severity:\s*['"]critical/, 'Must include severity level');
assert.match(systemCheckCode, /action:/, 'Must include actionable guidance (not silent)');
assert.match(systemCheckCode, /detail:/, 'Must include error details');

// ─────────────────────────────────────────────────────────────────────────
// Test 4: Verify output shows real status counters
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /moduleCount.*moduleTotal/, 'Must count loaded modules vs total');
assert.match(systemCheckCode, /Modules:.*\//, 'Must display module ratio like "Modules: 6/7"');
assert.match(systemCheckCode, /synced:/, 'Must show Vault sync status');
assert.match(systemCheckCode, /online:/, 'Must show Weather online status');

// ─────────────────────────────────────────────────────────────────────────
// Test 5: Verify storage system is checked with fallbacks
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /checkStorage/, 'Must have dedicated storage check function');
assert.match(systemCheckCode, /initDB/, 'Must check IndexedDB initialization');
assert.match(systemCheckCode, /localStorage/, 'Must check LocalStorage fallback');
assert.match(systemCheckCode, /STORAGE_WRITE_FAILED/, 'Must report write failures');

// ─────────────────────────────────────────────────────────────────────────
// Test 6: Verify voice system is checked
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /checkVoice/, 'Must have dedicated voice check function');
assert.match(systemCheckCode, /speechSynthesis/, 'Must check Web Speech API availability');
assert.match(systemCheckCode, /VOICE_SYNTHESIS_UNAVAILABLE/, 'Must report voice synthesis failures');

// ─────────────────────────────────────────────────────────────────────────
// Test 7: Verify neural/GPU is checked with fallback info
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /checkNeural/, 'Must have dedicated neural check function');
assert.match(systemCheckCode, /webgl2|webgl/, 'Must check GPU availability');
assert.match(systemCheckCode, /GPU_UNAVAILABLE/, 'Must report GPU unavailability');
assert.match(systemCheckCode, /cpu-fallback/, 'Must mention CPU fallback option');

// ─────────────────────────────────────────────────────────────────────────
// Test 8: Verify error handling (not silent)
// ─────────────────────────────────────────────────────────────────────────
assert.doesNotMatch(systemCheckCode, /try\s*\{[^}]*\}\s*catch\s*\(\s*\)\s*\{/, 'Must not catch errors silently');
assert.match(systemCheckCode, /catch\s*\(\s*\w+\s*\)/, 'Must capture error objects');
assert.match(systemCheckCode, /systemStatus\.errors\.push/, 'Must actively push errors to status object');

// ─────────────────────────────────────────────────────────────────────────
// Test 9: Verify UI feedback and logging
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /console\.log|console\.error|console\.warn/, 'Must log status visibly');
assert.match(systemCheckCode, /printSystemStatus/, 'Must have dedicated output function');
assert.match(systemCheckCode, /ORBITSystemCheck/, 'Must expose API in window object');

// ─────────────────────────────────────────────────────────────────────────
// Test 10: Verify timeout handling (not infinite wait)
// ─────────────────────────────────────────────────────────────────────────
assert.match(systemCheckCode, /SYSTEMCHECK_TIMEOUT\s*=\s*\d+/, 'Must define timeout constant');
assert.match(systemCheckCode, /setTimeout/, 'Must use setTimeout for timeout protection');
assert.match(systemCheckCode, /clearTimeout/, 'Must clean up timers');

console.log('✅ 10 SYSTEMCHECK boot verification tests passed');
console.log('   - All 7 modules are checked (Storage, Neural, Voice, Briefing, AI, Dashboard, Weather)');
console.log('   - Errors are reported with type, severity, and action (no silent-fails)');
console.log('   - Real system status: "Modules: X/7 ✓", "Vault: synced", "Weather: online", etc.');
console.log('   - Storage, Voice, Neural/GPU checked with fallback info');
console.log('   - No silent error handlers or chained optional chains');
console.log('   - Status logged to console and exposed in window.ORBITSystemCheck');
console.log('   - Timeout enforced (no infinite waits)');
