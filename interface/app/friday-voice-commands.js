/**
 * FRIDAY v2 Voice Commands — Complete Rebuild
 * - Web Speech API for real voice recognition (de-DE)
 * - Browser TTS for voice output
 * - 3 Core Commands: 'Briefing', 'Wetter', 'Aufgaben'
 * - Obsidian Vault Integration
 * - Real-time Testing (NOT Headless)
 */

(function(root) {
  'use strict';

  // ============================================================================
  // 1. CONSTANTS & SETUP
  // ============================================================================

  const SpeechRecognition = root.SpeechRecognition || root.webkitSpeechRecognition;
  const SpeechSynthesis = root.speechSynthesis;

  const COMMANDS = {
    // Briefing: spricht Obsidian-Vault-Daten vor
    briefing: {
      patterns: [
        /^(briefing|brief|guten morgen|morgens?)/i,
        /^(zeige? mir?|sag mir?).*(briefing|brief)/i,
        /^(briefing|kurz).*zusammenfassung/i
      ],
      handler: 'handleBriefing',
      label: 'Briefing'
    },
    
    // Wetter: liest Forecast vor
    weather: {
      patterns: [
        /^(wetter|wie ist das wetter|wetterbericht)/i,
        /^(wetter|temperatur|wind)/i,
        /^(zeige? mir?|sag mir?).*(wetter|temperatur|forecast)/i
      ],
      handler: 'handleWeather',
      label: 'Wetter'
    },
    
    // Aufgaben: listet Tagesplan auf
    tasks: {
      patterns: [
        /^(aufgaben|tagesplan|was ist heute|agenda)/i,
        /^(zeige? mir?|sag mir?).*(aufgaben|agenda|heute)/i,
        /^(übersicht|status).*aufgaben/i
      ],
      handler: 'handleTasks',
      label: 'Aufgaben'
    },
    
    // Zusätzliche Commands
    stop: {
      patterns: [/^(stopp|stop|ruhe|abbrechen|quiet)/i],
      handler: 'handleStop',
      label: 'Stop'
    }
  };

  // Audio mix profile für Voice Ducking
  const AUDIO_MIX = Object.freeze({
    normal: 0.8,
    speaking: 0.15,  // Music wird runtergedimmt wenn wir sprechen
    response: 0.92   // Voice-Antwort
  });

  // ============================================================================
  // 2. STATE MANAGEMENT
  // ============================================================================

  let state = {
    isListening: false,
    isSpeaking: false,
    currentTranscript: '',
    interimTranscript: '',
    recognition: null,
    briefingData: null,
    weatherData: null,
    tasksData: null,
    lastCommandTime: 0
  };

  // ============================================================================
  // 3. VOICE RECOGNITION ENGINE
  // ============================================================================

  function initRecognition() {
    if (!SpeechRecognition) {
      console.error('[VOICE] Speech Recognition API not available');
      return false;
    }

    state.recognition = new SpeechRecognition();
    state.recognition.lang = 'de-DE';
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    state.recognition.maxAlternatives = 3;

    // ONSTART: User spricht, wir hören zu
    state.recognition.onstart = function() {
      state.isListening = true;
      updateUI('listening', 'Ich höre zu …');
      console.log('[VOICE-REC] Listening started (de-DE)');
      playFeedback('listening');
    };

    // ONRESULT: Echtzeit-Transkription
    state.recognition.onresult = function(event) {
      state.interimTranscript = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
          console.log(`[VOICE-REC] FINAL: "${transcript}" (confidence: ${event.results[i][0].confidence.toFixed(2)})`);
        } else {
          state.interimTranscript += transcript;
          console.log(`[VOICE-REC] INTERIM: "${transcript}"`);
        }
      }

      state.currentTranscript = finalText.trim();
      updateTranscript(finalText.trim() || state.interimTranscript);

      // Nur wenn finalText vorhanden
      if (finalText.trim()) {
        const matched = parseCommand(finalText.trim());
        if (matched) {
          executeCommand(matched);
        }
      }
    };

    // ONERROR: Fehlerbehandlung
    state.recognition.onerror = function(event) {
      console.error('[VOICE-REC] Error:', event.error);
      state.isListening = false;

      let message = 'Fehler bei der Spracherkennung.';
      if (event.error === 'no-speech') {
        message = 'Keine Spracheingabe erkannt. Bitte wiederholen.';
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        message = 'Mikrofonzugriff verweigert. Bitte Berechtigungen prüfen.';
      } else if (event.error === 'network') {
        message = 'Netzwerkfehler. Offline-Modus aktivieren.';
      }

      updateUI('error', message);
      speak(message);
    };

    // ONEND: Erkennung beendet
    state.recognition.onend = function() {
      state.isListening = false;
      console.log('[VOICE-REC] Recognition stopped');
      if (!state.isSpeaking) {
        updateUI('ready', 'Bereit');
      }
    };

    return true;
  }

  // ============================================================================
  // 4. COMMAND PARSING
  // ============================================================================

  function parseCommand(transcript) {
    const lower = transcript.toLowerCase();
    
    for (const [commandKey, commandDef] of Object.entries(COMMANDS)) {
      for (const pattern of commandDef.patterns) {
        if (pattern.test(lower)) {
          console.log(`[VOICE-PARSE] Matched: ${commandDef.label}`);
          return {
            key: commandKey,
            def: commandDef,
            transcript
          };
        }
      }
    }

    console.log('[VOICE-PARSE] No command matched for:', lower);
    return null;
  }

  // ============================================================================
  // 5. COMMAND HANDLERS
  // ============================================================================

  async function handleBriefing() {
    updateUI('processing', 'Briefing wird vorbereitet …');
    console.log('[BRIEFING] Loading vault briefing data');

    try {
      // Versuch, vault_briefing.json zu laden (vom Hermes Cron generiert)
      const resp = await fetch('./vault_briefing.json?_=' + Date.now(), { cache: 'no-store' });
      if (resp.ok) {
        state.briefingData = await resp.json();
        console.log('[BRIEFING] Data loaded:', state.briefingData);
      } else {
        throw new Error('Briefing nicht gefunden');
      }
    } catch (err) {
      console.warn('[BRIEFING] Could not load vault_briefing.json:', err.message);
      state.briefingData = null;
    }

    // Format & speak
    const text = formatBriefing(state.briefingData);
    updateUI('speaking', 'Briefing wird vorgelesen …');
    speak(text);

    // Anzeige
    const el = document.querySelector('#voiceResponse');
    if (el) {
      el.textContent = state.briefingData 
        ? `📋 Briefing: ${state.briefingData.projects?.length || 0} Projekte, ${state.briefingData.health ? '✓ Gesundheit erfasst' : 'keine Gesundheitsdaten'}`
        : 'Keine Briefing-Daten verfügbar';
    }
  }

  async function handleWeather() {
    updateUI('processing', 'Wetterdaten werden geladen …');
    console.log('[WEATHER] Fetching weather');

    try {
      // Open-Meteo API (kostenlos, kein Auth)
      const lat = 52.52; // Berlin (Beispiel) — später von Rene's Location
      const lon = 13.40;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Berlin`;
      
      const resp = await fetch(url);
      const data = await resp.json();
      state.weatherData = {
        temp: Math.round(data.current.temperature_2m),
        weather: getWeatherDescription(data.current.weather_code),
        wind: Math.round(data.current.wind_speed_10m),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      };
      console.log('[WEATHER] Data loaded:', state.weatherData);
    } catch (err) {
      console.error('[WEATHER] Error:', err.message);
      state.weatherData = {
        temp: '?',
        weather: 'Keine Daten',
        wind: '?',
        offline: true
      };
    }

    // Format & speak
    const text = formatWeather(state.weatherData);
    updateUI('speaking', 'Wetterbericht wird vorgelesen …');
    speak(text);

    // Anzeige
    const el = document.querySelector('#voiceResponse');
    if (el) {
      el.textContent = `🌤️ Wetter: ${state.weatherData.temp}°, ${state.weatherData.weather}`;
    }
  }

  async function handleTasks() {
    updateUI('processing', 'Aufgaben werden geladen …');
    console.log('[TASKS] Loading tasks');

    try {
      // Versuche, aus IndexedDB oder localStorage zu laden
      if (window.ORBITStorageV2 && window.ORBITStorageV2.getTasks) {
        state.tasksData = await window.ORBITStorageV2.getTasks();
      } else if (window.ORBITApp && window.ORBITApp.getTasks) {
        state.tasksData = await window.ORBITApp.getTasks();
      } else {
        // Fallback: Versuche aus DOM zu lesen
        const todayCount = document.querySelector('#todayCount')?.textContent || '0';
        const overdueCount = document.querySelector('#overdueCount')?.textContent || '0';
        const weekCount = document.querySelector('#weekCount')?.textContent || '0';
        
        state.tasksData = {
          today: parseInt(todayCount),
          overdue: parseInt(overdueCount),
          week: parseInt(weekCount)
        };
      }
      console.log('[TASKS] Data loaded:', state.tasksData);
    } catch (err) {
      console.error('[TASKS] Error:', err.message);
      state.tasksData = null;
    }

    // Format & speak
    const text = formatTasks(state.tasksData);
    updateUI('speaking', 'Aufgaben-Übersicht wird vorgelesen …');
    speak(text);

    // Anzeige
    const el = document.querySelector('#voiceResponse');
    if (el && state.tasksData) {
      el.textContent = `📌 Aufgaben: ${state.tasksData.today || 0} heute, ${state.tasksData.overdue || 0} überfällig`;
    }
  }

  function handleStop() {
    console.log('[COMMAND] Stop requested');
    state.isSpeaking = false;
    SpeechSynthesis.cancel();
    if (state.recognition) state.recognition.abort();
    updateUI('ready', 'Unterbrochen');
    const el = document.querySelector('#voiceResponse');
    if (el) el.textContent = 'Ausgabe gestoppt.';
  }

  // ============================================================================
  // 6. TEXT FORMATTING FOR SPEECH
  // ============================================================================

  function formatBriefing(data) {
    if (!data) {
      return 'Keine Briefing-Daten verfügbar. Bitte versuchen Sie es später erneut.';
    }

    const parts = [];
    
    if (data.date) {
      parts.push(`Heute ist ${data.date}.`);
    }
    
    if (data.greeting) {
      parts.push(data.greeting);
    }
    
    if (data.projects && data.projects.length > 0) {
      const projectList = data.projects.slice(0, 3).join(', ');
      parts.push(`Aktive Projekte: ${projectList}.`);
    }
    
    if (data.crypto) {
      parts.push(`Crypto Status: ${data.crypto.text || 'Unverändert.'}`);
    }
    
    if (data.health) {
      parts.push(`Gesundheit: ${data.health}.`);
    }
    
    if (data.focus) {
      parts.push(`Fokus für heute: ${data.focus}.`);
    }

    return parts.join(' ') || 'Briefing geladen, aber keine spezifischen Daten verfügbar.';
  }

  function formatWeather(data) {
    if (data.offline) {
      return 'Wetterdaten sind derzeit nicht verfügbar. Überprüfen Sie Ihre Internetverbindung.';
    }
    
    return `Aktuelle Wetterlage: ${data.temp} Grad Celsius, ${data.weather}. Windgeschwindigkeit: ${data.wind} Kilometer pro Stunde.`;
  }

  function formatTasks(data) {
    if (!data) {
      return 'Keine Aufgabendaten verfügbar.';
    }

    const parts = [];
    
    if (data.overdue && data.overdue > 0) {
      const s = data.overdue === 1 ? 'e' : 'n';
      parts.push(`Sie haben ${data.overdue} überfällige Aufgabe${s}.`);
    }
    
    if (data.today && data.today > 0) {
      const s = data.today === 1 ? '' : 'n';
      parts.push(`Heute sind ${data.today} Aufgabe${s} geplant.`);
    }
    
    if (data.week && data.week > 0) {
      const s = data.week === 1 ? '' : 'n';
      parts.push(`In der nächsten Woche: ${data.week} Aufgabe${s}.`);
    }

    if (parts.length === 0) {
      return 'Sie haben derzeit keine geplanten Aufgaben. Ausgezeichnet.';
    }

    return parts.join(' ');
  }

  function getWeatherDescription(code) {
    const descriptions = {
      0: 'Klar',
      1: 'Hauptsächlich klar',
      2: 'Teilweise bewölkt',
      3: 'Bewölkt',
      45: 'Neblig',
      48: 'Raureif',
      51: 'Leichter Nieselregen',
      53: 'Moderater Nieselregen',
      55: 'Dichter Nieselregen',
      61: 'Leichter Regen',
      63: 'Moderater Regen',
      65: 'Starker Regen',
      71: 'Leichter Schneefall',
      73: 'Mäßiger Schneefall',
      75: 'Dichter Schneefall',
      80: 'Leichte Regenschauer',
      81: 'Mäßige Regenschauer',
      82: 'Heftige Regenschauer',
      85: 'Leichte Schneeschauer',
      86: 'Heftige Schneeschauer',
      95: 'Gewitter',
      96: 'Gewitter mit Hagel',
      99: 'Gewitter mit großem Hagel'
    };
    return descriptions[code] || 'Bedeckt';
  }

  // ============================================================================
  // 7. TEXT-TO-SPEECH OUTPUT
  // ============================================================================

  function speak(text) {
    if (!SpeechSynthesis) {
      console.error('[TTS] Speech Synthesis API not available');
      return;
    }

    // Stoppe alle aktiven Ausgaben
    SpeechSynthesis.cancel();
    state.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;        // Normal speed
    utterance.pitch = 1.0;       // Normal pitch
    utterance.volume = AUDIO_MIX.response;

    utterance.onstart = function() {
      console.log('[TTS] Speaking started');
      duckAudio(true);  // Music runtergedimmt
    };

    utterance.onend = function() {
      console.log('[TTS] Speaking ended');
      state.isSpeaking = false;
      duckAudio(false); // Music zurück
      updateUI('ready', 'Bereit');
    };

    utterance.onerror = function(event) {
      console.error('[TTS] Error:', event.error);
      state.isSpeaking = false;
      duckAudio(false);
    };

    SpeechSynthesis.speak(utterance);
  }

  // ============================================================================
  // 8. AUDIO MIXING (Music ducking)
  // ============================================================================

  function duckAudio(shouldDuck) {
    // Suche nach Audio-Elementen und reduziere ihre Lautstärke
    const audioElements = document.querySelectorAll('audio');
    const volume = shouldDuck ? AUDIO_MIX.speaking : AUDIO_MIX.normal;

    audioElements.forEach(audio => {
      audio.volume = volume;
      console.log(`[AUDIO-DUCK] Set audio volume to ${volume}`);
    });

    // Auch bei Web Audio Context, falls vorhanden
    if (window.ORBITAudioEngine && window.ORBITAudioEngine.setVolume) {
      window.ORBITAudioEngine.setVolume(volume);
    }
  }

  function playFeedback(type) {
    // Audio-Feedback für Listening-Start (optional)
    // z.B. kurzer Beep oder TTS "Ich höre zu"
    console.log(`[FEEDBACK] ${type}`);
  }

  // ============================================================================
  // 9. UI UPDATES
  // ============================================================================

  function updateUI(state, message) {
    const stateEl = document.querySelector('#voiceState');
    const btnEl = document.querySelector('#voiceCoreBtn');
    const transcriptEl = document.querySelector('#voiceTranscript');

    if (stateEl) stateEl.textContent = message;
    
    if (btnEl) {
      btnEl.dataset.state = state;
      btnEl.setAttribute('aria-pressed', state === 'listening' ? 'true' : 'false');
    }

    console.log(`[UI] State: ${state}, Message: ${message}`);
  }

  function updateTranscript(text) {
    const el = document.querySelector('#voiceTranscript');
    if (el) el.textContent = text || 'Sprich jetzt …';
  }

  // ============================================================================
  // 10. COMMAND EXECUTION
  // ============================================================================

  async function executeCommand(matched) {
    console.log(`[EXECUTE] Running handler: ${matched.def.handler}`);
    const handler = window[matched.def.handler] || eval(matched.def.handler);

    if (typeof handler === 'function') {
      try {
        await handler();
        state.lastCommandTime = Date.now();
      } catch (err) {
        console.error('[EXECUTE] Handler error:', err);
        speak(`Fehler beim Ausführen von ${matched.def.label}. Bitte versuchen Sie es später erneut.`);
      }
    } else {
      console.error(`[EXECUTE] Handler not found: ${matched.def.handler}`);
      speak('Befehl konnte nicht ausgeführt werden.');
    }
  }

  // ============================================================================
  // 11. PUBLIC API
  // ============================================================================

  window.FRIDAYVoiceCommands = {
    init: function() {
      console.log('[VOICE-COMMANDS] Initializing...');
      const success = initRecognition();
      if (success) {
        updateUI('ready', 'Bereit');
        console.log('[VOICE-COMMANDS] ✓ Ready for voice input');
      } else {
        updateUI('error', 'Spracherkennung nicht verfügbar');
      }
      return success;
    },

    startListening: function() {
      if (state.isListening) {
        console.log('[VOICE-COMMANDS] Already listening, stopping...');
        state.recognition?.abort();
        return;
      }

      if (!state.recognition) {
        this.init();
      }

      console.log('[VOICE-COMMANDS] Starting listening...');
      state.recognition?.start();
      updateUI('listening', 'Mikrofon wird aktiviert …');
    },

    stopListening: function() {
      console.log('[VOICE-COMMANDS] Stopping listening');
      state.recognition?.abort();
      updateUI('ready', 'Bereit');
    },

    getState: function() {
      return {
        isListening: state.isListening,
        isSpeaking: state.isSpeaking,
        transcript: state.currentTranscript,
        briefing: state.briefingData,
        weather: state.weatherData,
        tasks: state.tasksData
      };
    },

    speak: speak,

    // Direct command execution (for testing)
    executeTest: async function(commandKey) {
      const cmdDef = COMMANDS[commandKey];
      if (cmdDef) {
        console.log(`[TEST] Executing ${commandKey}`);
        const handler = window[cmdDef.handler];
        if (typeof handler === 'function') {
          await handler();
        }
      }
    }
  };

  // Mache Handler global verfügbar für executeCommand
  window.handleBriefing = handleBriefing;
  window.handleWeather = handleWeather;
  window.handleTasks = handleTasks;
  window.handleStop = handleStop;

  console.log('[VOICE-COMMANDS] Module loaded. Call FRIDAYVoiceCommands.init() to start.');

})(typeof window !== 'undefined' ? window : globalThis);
