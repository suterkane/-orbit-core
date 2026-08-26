/**
 * FRIDAY Voice Commands Initialization
 * Wird beim DOMContentLoaded aufgerufen
 */

(function() {
  'use strict';

  function initializeVoiceCommands() {
    console.log('[INIT] Initializing FRIDAY Voice Commands...');

    // Warte bis das Hauptmodul geladen ist
    if (typeof FRIDAYVoiceCommands === 'undefined') {
      console.warn('[INIT] FRIDAYVoiceCommands not loaded yet, retrying...');
      setTimeout(initializeVoiceCommands, 500);
      return;
    }

    // Initialisiere Voice System
    const success = FRIDAYVoiceCommands.init();
    console.log(`[INIT] Voice Commands initialized: ${success ? '✓' : '✗'}`);

    // Verbinde Voice-Button mit Listening-Start
    const voiceBtn = document.querySelector('#voiceCoreBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        console.log('[VOICE-BTN] Click detected');
        FRIDAYVoiceCommands.startListening();
      });
      console.log('[INIT] Voice button connected');
    }

    // Optional: Auto-start briefing beim Laden (falls gewünscht)
    // FRIDAYVoiceCommands.executeTest('briefing');

    console.log('[INIT] ✓ FRIDAY Voice Commands ready');
  }

  // Starte Initialisierung wenn DOM geladen
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVoiceCommands);
  } else {
    initializeVoiceCommands();
  }
})();
