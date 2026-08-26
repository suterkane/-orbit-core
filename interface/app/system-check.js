// ============================================================================
// FRIDAY v2 — SYSTEMCHECK beim Boot
// ============================================================================
// Transparente Modul-Prüfung: Zeige echten Status statt Silent-Fails
// ============================================================================

(()=>{
  const SYSTEMCHECK_VERSION = 'v2.1';
  const SYSTEMCHECK_TIMEOUT = 8000;
  const REQUIRED_MODULES = {
    'Storage': 'ORBITStorageV2',
    'Neural': 'ORBITNeuralCore',
    'Voice': 'ORBITVoiceV2',
    'Briefing': 'ORBITFridayBriefing',
    'AI': 'ORBITFridayAI',
    'Dashboard': 'ORBITDashboardV2',
    'Weather': 'ORBITWeatherV2'
  };

  const EXTERNAL_SERVICES = {
    'Vault': { check: () => !!window.ORBIT_SYNC_STATUS, label: 'Cloud Sync' },
    'Weather': { check: () => !!window.ORBIT_WEATHER_DATA, label: 'Weather API' },
    'AI-Bridge': { check: () => !!window.FRIDAY_AI_BRIDGE, label: 'AI Gateway' }
  };

  let systemStatus = {
    timestamp: new Date().toISOString(),
    version: SYSTEMCHECK_VERSION,
    modules: {},
    services: {},
    vault: { synced: false, lastSync: null },
    weather: { online: false, lastUpdate: null },
    errors: [],
    warnings: [],
    bootTime: null
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 1. MODULE CHECKING
  // ─────────────────────────────────────────────────────────────────────────
  
  function checkModules() {
    let loadedCount = 0;
    const moduleStatus = {};

    for (const [name, windowKey] of Object.entries(REQUIRED_MODULES)) {
      const isLoaded = !!window[windowKey];
      moduleStatus[name] = { loaded: isLoaded, key: windowKey };
      if (isLoaded) loadedCount++;
      else {
        systemStatus.errors.push({
          type: 'MODULE_MISSING',
          module: name,
          detail: `Expected window.${windowKey} to exist`,
          severity: 'critical',
          action: `Check if ${windowKey} module script is included in index.html`
        });
      }
    }

    systemStatus.modules = moduleStatus;
    systemStatus.moduleLoadCount = loadedCount;
    systemStatus.modulesReady = loadedCount === Object.keys(REQUIRED_MODULES).length;

    return systemStatus.modulesReady;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. STORAGE SYSTEM CHECK
  // ─────────────────────────────────────────────────────────────────────────

  async function checkStorage() {
    const storage = window.ORBITStorageV2;
    if (!storage) {
      systemStatus.errors.push({
        type: 'STORAGE_UNAVAILABLE',
        severity: 'critical',
        action: 'Cannot initialize database without Storage module'
      });
      return false;
    }

    try {
      // Test IndexedDB
      const testDb = await storage.initDB?.();
      if (!testDb) {
        systemStatus.warnings.push({
          type: 'INDEXEDDB_DEGRADED',
          detail: 'IndexedDB initialized but may be read-only or quota-limited',
          fallback: 'Using LocalStorage as backup'
        });
      }

      // Test LocalStorage
      const testKey = '__ORBIT_TEST_' + Date.now();
      storage.saveState?.(testKey, { test: true });
      const testVal = storage.getState?.(testKey);
      storage.saveState?.(testKey, null); // cleanup

      if (!testVal || !testVal.test) {
        systemStatus.errors.push({
          type: 'STORAGE_WRITE_FAILED',
          severity: 'critical',
          action: 'LocalStorage not writable. Check browser permissions and storage quota.'
        });
        return false;
      }

      systemStatus.storage = {
        indexedDB: !!testDb,
        localStorage: true,
        writable: true,
        status: 'operational'
      };
      return true;
    } catch (err) {
      systemStatus.errors.push({
        type: 'STORAGE_ERROR',
        detail: err.message,
        severity: 'critical',
        action: 'Clear browser cache/cookies and reload'
      });
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. VOICE SYSTEM CHECK
  // ─────────────────────────────────────────────────────────────────────────

  function checkVoice() {
    const voice = window.ORBITVoiceV2;
    if (!voice) {
      systemStatus.errors.push({
        type: 'VOICE_MODULE_MISSING',
        severity: 'high',
        action: 'Voice module not found. Some features will be silent.'
      });
      return false;
    }

    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        systemStatus.warnings.push({
          type: 'VOICE_SYNTHESIS_UNAVAILABLE',
          detail: 'Web Speech API not supported in this browser',
          fallback: 'Using fallback voice or text-only mode'
        });
        return false;
      }

      systemStatus.voice = {
        available: true,
        synthesis: !!synth,
        status: 'ready'
      };
      return true;
    } catch (err) {
      systemStatus.errors.push({
        type: 'VOICE_INIT_ERROR',
        detail: err.message,
        severity: 'high'
      });
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. NEURAL CORE CHECK
  // ─────────────────────────────────────────────────────────────────────────

  function checkNeural() {
    const neural = window.ORBITNeuralCore;
    if (!neural) {
      systemStatus.errors.push({
        type: 'NEURAL_CORE_MISSING',
        severity: 'critical',
        action: 'Neural Core not loaded. GPU particle system will not render.'
      });
      return false;
    }

    try {
      // Check if GPU available
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const gpuAvailable = !!gl;

      if (!gpuAvailable) {
        systemStatus.warnings.push({
          type: 'GPU_UNAVAILABLE',
          detail: 'WebGL not supported. Falling back to CPU rendering.',
          impact: 'Reduced visual quality and performance'
        });
      }

      systemStatus.neural = {
        loaded: true,
        gpu: gpuAvailable,
        status: gpuAvailable ? 'full-acceleration' : 'cpu-fallback'
      };
      return true;
    } catch (err) {
      systemStatus.errors.push({
        type: 'NEURAL_INIT_ERROR',
        detail: err.message,
        severity: 'high'
      });
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. AI BRIDGE CHECK
  // ─────────────────────────────────────────────────────────────────────────

  function checkAI() {
    const ai = window.ORBITFridayAI;
    if (!ai) {
      systemStatus.errors.push({
        type: 'AI_MODULE_MISSING',
        severity: 'critical',
        action: 'AI module not loaded. Smart features will not work.'
      });
      return false;
    }

    systemStatus.ai = {
      loaded: true,
      bridge: !!window.FRIDAY_AI_BRIDGE,
      status: window.FRIDAY_AI_BRIDGE ? 'connected' : 'local-only'
    };
    return !!ai;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. DASHBOARD CHECK
  // ─────────────────────────────────────────────────────────────────────────

  function checkDashboard() {
    const dashboard = window.ORBITDashboardV2;
    if (!dashboard) {
      systemStatus.errors.push({
        type: 'DASHBOARD_MISSING',
        severity: 'high',
        action: 'Dashboard module not loaded. UI will not render.'
      });
      return false;
    }

    systemStatus.dashboard = { loaded: true, status: 'ready' };
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. WEATHER CHECK
  // ─────────────────────────────────────────────────────────────────────────

  async function checkWeather() {
    const weather = window.ORBITWeatherV2;
    if (!weather) {
      systemStatus.warnings.push({
        type: 'WEATHER_MODULE_MISSING',
        severity: 'low',
        impact: 'Weather data will not be available'
      });
      return false;
    }

    try {
      // Try to fetch weather data
      const hasWeatherData = !!window.ORBIT_WEATHER_DATA;
      systemStatus.weather = {
        loaded: true,
        online: hasWeatherData,
        lastUpdate: hasWeatherData ? new Date().toISOString() : null,
        status: hasWeatherData ? 'online' : 'offline'
      };
      return hasWeatherData;
    } catch (err) {
      systemStatus.weather = {
        loaded: true,
        online: false,
        status: 'error',
        detail: err.message
      };
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. BRIEFING CHECK
  // ─────────────────────────────────────────────────────────────────────────

  function checkBriefing() {
    const briefing = window.ORBITFridayBriefing;
    if (!briefing) {
      systemStatus.warnings.push({
        type: 'BRIEFING_MODULE_MISSING',
        severity: 'low',
        impact: 'Daily briefing will not be available'
      });
      return false;
    }

    systemStatus.briefing = { loaded: true, status: 'ready' };
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. CLOUD SYNC CHECK
  // ─────────────────────────────────────────────────────────────────────────

  function checkVaultSync() {
    try {
      const syncStatus = window.ORBIT_SYNC_STATUS;
      if (syncStatus) {
        systemStatus.vault = {
          synced: syncStatus.synced === true,
          lastSync: syncStatus.lastSync || null,
          status: syncStatus.synced ? 'synced' : 'pending'
        };
        return true;
      }
      systemStatus.vault = {
        synced: false,
        lastSync: null,
        status: 'not-connected'
      };
      return false;
    } catch (err) {
      systemStatus.vault = {
        synced: false,
        error: err.message,
        status: 'error'
      };
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10. COMPREHENSIVE BOOT CHECK
  // ─────────────────────────────────────────────────────────────────────────

  async function runSystemCheck() {
    const startTime = performance.now();

    // Phase 1: Synchronous module checks
    console.group('🔧 FRIDAY v2 SYSTEMCHECK');
    console.log(`Version: ${SYSTEMCHECK_VERSION}`);
    console.log(`Time: ${systemStatus.timestamp}`);

    checkModules();
    checkNeural();
    checkDashboard();
    checkAI();
    checkBriefing();
    checkVoice();

    // Phase 2: Async checks
    await checkStorage();
    await checkWeather();
    checkVaultSync();

    // Calculate boot time
    systemStatus.bootTime = performance.now() - startTime;

    // Phase 3: Print detailed status
    printSystemStatus();

    // Phase 4: Dispatch ready event
    document.dispatchEvent(new Event('ORBITSystemCheckComplete'));

    return systemStatus;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 11. STATUS REPORT PRINTER
  // ─────────────────────────────────────────────────────────────────────────

  function printSystemStatus() {
    // MODULES SUMMARY
    const moduleCount = systemStatus.moduleLoadCount;
    const moduleTotal = Object.keys(REQUIRED_MODULES).length;
    const moduleStatus = moduleCount === moduleTotal ? '✓ READY' : '✗ INCOMPLETE';
    console.log(`\n📦 Modules: ${moduleCount}/${moduleTotal} ${moduleStatus}`);

    for (const [name, status] of Object.entries(systemStatus.modules)) {
      const icon = status.loaded ? '✓' : '✗';
      console.log(`  ${icon} ${name}: ${status.loaded ? 'loaded' : 'MISSING'}`);
    }

    // STORAGE
    if (systemStatus.storage) {
      console.log(`\n💾 Storage: ${systemStatus.storage.status.toUpperCase()}`);
      console.log(`  ✓ IndexedDB: ${systemStatus.storage.indexedDB ? 'online' : 'offline'}`);
      console.log(`  ✓ LocalStorage: ${systemStatus.storage.localStorage ? 'online' : 'offline'}`);
    }

    // NEURAL
    if (systemStatus.neural) {
      const gpuIcon = systemStatus.neural.gpu ? '✓' : '⚠';
      console.log(`\n🧠 Neural Core: ${systemStatus.neural.status.toUpperCase()}`);
      console.log(`  ${gpuIcon} GPU: ${systemStatus.neural.gpu ? 'available' : 'unavailable (CPU fallback)'}`);
    }

    // VOICE
    if (systemStatus.voice) {
      const voiceIcon = systemStatus.voice.available ? '✓' : '✗';
      console.log(`\n🎙️ Voice: ${systemStatus.voice.status.toUpperCase()}`);
      console.log(`  ${voiceIcon} Speech Synthesis: ${systemStatus.voice.synthesis ? 'ready' : 'unavailable'}`);
    }

    // AI
    if (systemStatus.ai) {
      const aiIcon = systemStatus.ai.bridge ? '✓' : '⚠';
      console.log(`\n🤖 AI: ${systemStatus.ai.status.toUpperCase()}`);
      console.log(`  ${aiIcon} Bridge: ${systemStatus.ai.status}`);
    }

    // DASHBOARD
    if (systemStatus.dashboard) {
      console.log(`\n📊 Dashboard: ${systemStatus.dashboard.status.toUpperCase()}`);
    }

    // VAULT
    if (systemStatus.vault) {
      const vaultIcon = systemStatus.vault.synced ? '✓' : '○';
      console.log(`\n☁️ Vault: ${vaultIcon} ${systemStatus.vault.status.toUpperCase()}`);
      if (systemStatus.vault.lastSync) {
        console.log(`  Last sync: ${new Date(systemStatus.vault.lastSync).toLocaleString()}`);
      }
    }

    // WEATHER
    if (systemStatus.weather) {
      const weatherIcon = systemStatus.weather.online ? '✓' : '○';
      console.log(`\n🌤️ Weather: ${weatherIcon} ${systemStatus.weather.status.toUpperCase()}`);
    }

    // ERRORS & WARNINGS
    if (systemStatus.errors.length > 0) {
      console.log(`\n❌ ERRORS (${systemStatus.errors.length}):`);
      systemStatus.errors.forEach((err, idx) => {
        console.error(`  [${idx + 1}] ${err.type}`);
        if (err.severity) console.error(`      Severity: ${err.severity.toUpperCase()}`);
        if (err.detail) console.error(`      Detail: ${err.detail}`);
        if (err.action) console.error(`      Action: ${err.action}`);
      });
    }

    if (systemStatus.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${systemStatus.warnings.length}):`);
      systemStatus.warnings.forEach((warn, idx) => {
        console.warn(`  [${idx + 1}] ${warn.type}`);
        if (warn.detail) console.warn(`      ${warn.detail}`);
        if (warn.fallback) console.warn(`      Fallback: ${warn.fallback}`);
      });
    }

    // BOOT TIME
    console.log(`\n⏱️ Boot check completed in ${systemStatus.bootTime.toFixed(2)}ms`);

    // OVERALL STATUS
    const isCritical = systemStatus.errors.some(e => e.severity === 'critical');
    const overallStatus = isCritical ? '🔴 CRITICAL' : '🟢 OPERATIONAL';
    console.log(`\n${overallStatus}`);
    console.groupEnd();

    // Also expose in window
    window.ORBIT_SYSTEMCHECK = systemStatus;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TIMEOUT HANDLER
  // ─────────────────────────────────────────────────────────────────────────

  let checkTimeout = setTimeout(() => {
    console.error('⏰ SYSTEMCHECK TIMEOUT after ' + SYSTEMCHECK_TIMEOUT + 'ms');
    systemStatus.errors.push({
      type: 'SYSTEMCHECK_TIMEOUT',
      severity: 'critical',
      action: 'Boot took too long. Check for slow modules or network issues.'
    });
    printSystemStatus();
  }, SYSTEMCHECK_TIMEOUT);

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  window.ORBITSystemCheck = {
    run: runSystemCheck,
    status: () => systemStatus,
    details: () => JSON.stringify(systemStatus, null, 2)
  };

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      runSystemCheck().catch(err => {
        console.error('SYSTEMCHECK FATAL ERROR:', err);
      });
    });
  } else {
    runSystemCheck().catch(err => {
      console.error('SYSTEMCHECK FATAL ERROR:', err);
    });
  }

})();
