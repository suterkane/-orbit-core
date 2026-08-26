# FRIDAY Voice Commands — Test Plan & Verification Guide

## Overview

FRIDAY Voice Commands wurde komplett neu aufgebaut mit:
- ✅ Web Speech API Recognition (de-DE)
- ✅ Browser TTS Output
- ✅ 3 Core Commands: Briefing, Wetter, Aufgaben
- ✅ Real-time Transcript Display
- ✅ Command Parsing & Intent Recognition
- ✅ Audio Ducking (Music wird leiser bei Voice)

## Test Approach: Real Testing (NOT Headless)

**WICHTIG:** Diese Tests erfordern einen echten Browser mit aktiviertem Mikrofon. Headless/CI-Tests funktionieren NICHT mit Web Speech API.

---

## 1. Quick Start: Test-Seite starten

```bash
# Öffne die Test-Seite im Browser:
# http://localhost:3000/app/voice-test.html
```

### UI Überblick:
- **Status Panel**: Zeigt Voice-Status, Browser-Support, letzte Kommandos
- **Transcript Display**: Real-time Spracherkennung
- **Manual Test Buttons**: Simulieren Befehle ohne Mikrofon
- **Debug Log**: Alle Events und Fehler

---

## 2. Pre-Test Checklist

### ✓ Browser & Umgebung
- [ ] Verwende Chrome/Chromium, Edge oder Safari (nicht Firefox auf Linux)
- [ ] Mikrofon ist angeschlossen und funktionsfähig
- [ ] Mikrofon-Berechtigungen sind aktiviert
- [ ] Keine anderen Apps nutzen das Mikrofon gleichzeitig
- [ ] lokale Test-URL: `localhost:3000/app/voice-test.html`

### ✓ Abhängigkeiten
- [ ] `friday-voice-commands.js` ist geladen (Browser Console: `typeof FRIDAYVoiceCommands`)
- [ ] `voice-test.html` lädt das Modul korrekt
- [ ] Keine JavaScript-Fehler in der Browser Console

---

## 3. Test Scenarios

### Test 3.1: Browser Support Detection

**Expected Behavior:**
- Browser Support zeigt: `✓ Yes (Recognition + TTS)`
- Log zeigt: `[SUCCESS] Browser support: ✓ Yes`

**Steps:**
1. Öffne `voice-test.html`
2. Warte bis die Seite vollständig geladen ist
3. Prüfe Status Panel

**Verification:**
```
Status Panel > Browser Support = "✓ Yes (Recognition + TTS)"
Debug Log zeigt: "[SUCCESS] Browser support: ✓ Yes"
```

**Pass/Fail:**
- ✅ PASS: Wenn Status = "✓ Yes"
- ❌ FAIL: Wenn Status = "✗ No" oder nicht angezeigt

---

### Test 3.2: Initialization

**Expected Behavior:**
- Klick auf "Initialize Voice" startet das Modul
- State wechselt zu "Ready"
- Log zeigt: `[SUCCESS] Initialization: ✓ Success`

**Steps:**
1. Öffne `voice-test.html`
2. Klick auf "Initialize Voice"
3. Warte 1-2 Sekunden

**Verification:**
```
voiceState = "Ready"
voiceStateIndicator = "IDLE" (hellblau)
Debug Log zeigt: "[SUCCESS] Initialization: ✓ Success"
```

**Pass/Fail:**
- ✅ PASS: Wenn State = "Ready" und Log zeigt Success
- ❌ FAIL: Wenn State = "Not initialized" oder Error im Log

---

### Test 3.3: Real Microphone Input — Briefing

**Expected Behavior:**
- Web Speech API lauscht auf Mikrofon
- Spricht das Wort "Briefing", "Brief" oder "Guten Morgen"
- Erkennt den Befehl und spricht Briefing-Text vor

**Steps:**
1. Klick "Initialize Voice"
2. Klick "Start Listening 🎤"
3. Sprich deutlich: **"Briefing"**
4. Warte auf Antwort (TTS)

**Expected Output:**
```
Status: "Listening..." → "Processing..." → "Ready"
Transcript: Zeigt "briefing" oder "brief"
voiceStateIndicator pulsiert: LISTENING → PROCESSING → SPEAKING → IDLE
Debug Log zeigt:
  [VOICE] Listening started
  [VOICE-REC] FINAL: "briefing"
  [VOICE-PARSE] Matched: Briefing
  [BRIEFING] Loading vault briefing data
  [TTS] Speaking started
  [TTS] Speaking ended
```

**Verification:**
```
1. Transcript zeigt erkannten Text
2. Browser spricht etwas vor (TTS-Ausgabe hörbar)
3. State ändert sich: LISTENING → PROCESSING → SPEAKING → IDLE
4. Kein Error im Debug Log
```

**Pass/Fail:**
- ✅ PASS: Alle 4 Verifikationen erfüllt
- ⚠️ PARTIAL: Spracherkennung funktioniert, aber TTS fehlschlagen (z.B. fehlende Briefing-Daten)
- ❌ FAIL: Keine Spracherkennung oder schwere Fehler

---

### Test 3.4: Real Microphone Input — Wetter

**Expected Behavior:**
- Sprich: "Wetter", "Wie ist das Wetter" oder "Wetterbericht"
- System fetcht Wetterdaten von Open-Meteo API
- Spricht Temperatur, Wetter-Zustand und Wind vor

**Steps:**
1. Klick "Initialize Voice"
2. Klick "Start Listening 🎤"
3. Sprich: **"Wetter"**
4. Warte auf API-Antwort + TTS

**Expected Output:**
```
Debug Log zeigt:
  [WEATHER] Fetching weather
  [WEATHER] Data loaded: { temp: 22, weather: 'Klar', wind: 5, ... }
  [TTS] "Aktuelle Wetterlage: 22 Grad Celsius, Klar. ..."
```

**Verification:**
```
1. Log zeigt: "[WEATHER] Data loaded"
2. Browser spricht Wetter vor
3. Temperatur, Wetter-Beschreibung und Wind werden genannt
4. Keine CORS/Network-Fehler
```

**Pass/Fail:**
- ✅ PASS: Alle Verifikationen erfüllt
- ⚠️ PARTIAL: API unreachable, fallback zu Offline-Daten
- ❌ FAIL: Keine Spracherkennung oder schwere Fehler

---

### Test 3.5: Real Microphone Input — Aufgaben

**Expected Behavior:**
- Sprich: "Aufgaben", "Tagesplan" oder "Was ist heute"
- System lädt Aufgaben-Daten aus IndexedDB/DOM
- Spricht Anzahl der Tasks pro Kategorie vor

**Steps:**
1. Klick "Initialize Voice"
2. Klick "Start Listening 🎤"
3. Sprich: **"Aufgaben"**
4. Warte auf Antwort

**Expected Output:**
```
Debug Log zeigt:
  [TASKS] Loading tasks
  [TASKS] Data loaded: { today: 3, overdue: 1, week: 7 }
  [TTS] "Sie haben 1 überfällige Aufgabe. Heute sind 3 Aufgaben geplant. ..."
```

**Verification:**
```
1. Log zeigt: "[TASKS] Data loaded"
2. Browser spricht Aufgaben-Übersicht vor
3. Zahlen werden korrekt verbalisiert
4. Keine Fehler im Log
```

**Pass/Fail:**
- ✅ PASS: Alle Verifikationen erfüllt
- ⚠️ PARTIAL: Spracherkennung ok, aber keine Task-Daten
- ❌ FAIL: Keine Spracherkennung oder schwere Fehler

---

### Test 3.6: Real Microphone Input — Stop

**Expected Behavior:**
- Sprich: "Stopp", "Stop" oder "Ruhe"
- Unterbricht aktuelle Ausgabe
- State wechselt zu "Ready"

**Steps:**
1. Starte ein Briefing (Test 3.3)
2. Während Browser noch spricht, klick "Initialize" und dann "Start Listening"
3. Sprich: **"Stopp"**

**Expected Output:**
```
Debug Log zeigt:
  [COMMAND] Stop requested
  [AUDIO-DUCK] Audio output stopped
  UI State: "Unterbrochen"
```

**Verification:**
```
1. TTS-Ausgabe stoppt sofort
2. State wechselt zu "IDLE"
3. voiceResponse zeigt: "Ausgabe gestoppt."
```

**Pass/Fail:**
- ✅ PASS: TTS stoppt sofort und State ändert sich
- ❌ FAIL: TTS läuft weiter oder andere Fehler

---

### Test 3.7: Manual Test without Microphone

**Purpose:** Schnelle Tests ohne echtes Mikrofon für CI/Demo

**Steps:**
1. Klick "Test: Briefing"
2. Warte 1-2 Sekunden
3. Prüfe Command Result Panel
4. Wiederhole für "Test: Wetter" und "Test: Aufgaben"

**Expected Output:**
```
Command Result zeigt:
  Briefing: { Status: "✓ Loaded/No data", Projects: N, Data: "..." }
  Weather: { Temp: "22", Weather: "Klar", Wind: "5 km/h" }
  Tasks: { Today: "3", Overdue: "1", "This Week": "7" }
```

**Verification:**
```
1. Jedes Test-Kommando zeigt ein Result-Panel
2. Fehler werden im Debug Log angezeigt
3. Keine JavaScript-Fehler in Browser Console
```

**Pass/Fail:**
- ✅ PASS: Alle Tests zeigen Results
- ⚠️ PARTIAL: Einige Tests fail (z.B. fehlende Briefing-Daten)
- ❌ FAIL: JavaScript-Fehler oder Modul nicht geladen

---

## 4. Integration Testing: Main App

Nachdem die `voice-test.html` PASS ist, teste die Integration in der Hauptapp:

### Test 4.1: Voice Button in Main UI

**Steps:**
1. Öffne `http://localhost:3000/app/index.html`
2. Suche den Voice-Button in der Top Bar (helles "◉" Symbol)
3. Klick den Button
4. Sprich einen Befehl

**Expected Output:**
- Button zeigt State-Änderung
- Transcript wird angezeigt
- Befehl wird ausgeführt

---

## 5. Debug Commands (Browser Console)

```javascript
// Zustand abfragen
FRIDAYVoiceCommands.getState()

// Manuell Befehl ausführen
await FRIDAYVoiceCommands.executeTest('briefing')
await FRIDAYVoiceCommands.executeTest('weather')
await FRIDAYVoiceCommands.executeTest('tasks')
await FRIDAYVoiceCommands.executeTest('stop')

// Text vorlesen (TTS Test)
FRIDAYVoiceCommands.speak('Hallo, dies ist ein Test.')

// Spracherkennung starten/stoppen
FRIDAYVoiceCommands.startListening()
FRIDAYVoiceCommands.stopListening()
```

---

## 6. Common Issues & Solutions

### Issue: "Browser Support: ✗ No"

**Cause:** Web Speech API nicht verfügbar
**Solution:**
- Verwende Chrome/Chromium/Edge (nicht Firefox auf Linux)
- Überprüfe Browser-Version (SpeechRecognition seit 2015)

### Issue: "Microphone permission denied"

**Cause:** Browser-Berechtigung verweigert
**Solution:**
- Öffne Browser-Einstellungen → Datenschutz
- Erlaube Mikrofon-Zugriff für `localhost:3000`
- Neuladen der Seite

### Issue: "No speech recognized"

**Cause:** Zu leise, Hintergrund-Geräusche oder falsche Sprache
**Solution:**
- Sprich deutlicher und lauter
- Reduziere Hintergrund-Geräusche
- Sicherstelle, dass du auf Deutsch sprichst
- Sprich langsamer (~60 WPM)

### Issue: "TTS voice not playing"

**Cause:** Browser Speaker mute oder Audio-Kontext nicht aktiv
**Solution:**
- Überprüfe Lautstärke-Einstellungen
- Klick auf einen Button um AudioContext zu aktivieren
- Prüfe ob Music nicht die Ausgabe blockiert

### Issue: "Briefing data not loading"

**Cause:** `vault_briefing.json` existiert nicht oder ist zu alt
**Solution:**
- Prüfe ob Datei in `app/` Verzeichnis existiert
- Regeneriere mit: `hermes run` (Cron-Job)
- Fallback auf Offline-Daten aus IndexedDB

---

## 7. Performance & Metrics

### Target Metrics:
- **Recognition Latency**: < 1s (bis "Listening" Fehler/Abbruch)
- **Parse Latency**: < 100ms (Transcript → Command)
- **Handler Latency**: < 2s (Command Execution)
- **TTS Playback**: < 500ms (bis Audio startet)

### Monitoring:
```javascript
const state = FRIDAYVoiceCommands.getState()
console.log('Listening:', state.isListening)
console.log('Speaking:', state.isSpeaking)
console.log('Last Transcript:', state.transcript)
```

---

## 8. Sign-Off Criteria

### ✅ ALL Tests PASS:
1. ✓ Browser Support: Detected
2. ✓ Initialization: Success
3. ✓ Microphone Recognition: Working (all 3 commands)
4. ✓ Command Parsing: Correct
5. ✓ TTS Output: Audible & Clear
6. ✓ State Management: Correct transitions
7. ✓ Debug Log: No errors
8. ✓ Main App Integration: Voice button works
9. ✓ Manual Tests: All pass
10. ✓ No Console Errors

### Test Result Template:
```
FRIDAY Voice Commands Test Report
==================================
Date: [YYYY-MM-DD]
Browser: [Chrome/Edge/Safari] Version X
OS: Windows
Tester: Rene

Test Results:
- 3.2 Initialization: PASS
- 3.3 Briefing: PASS
- 3.4 Weather: PASS
- 3.5 Tasks: PASS
- 3.6 Stop: PASS
- 3.7 Manual Tests: PASS
- 4.1 Main App Integration: PASS

Issues Found: None / [list]

Sign-Off: APPROVED ✓
```

---

## 9. Continuous Testing

Nach Deployment:

1. **Daily Manual Test**: Führe Scenario 3.3-3.5 aus
2. **Weekly Regression**: Alle Tests in diesem Guide
3. **Monitor Logs**: Prüfe Browser Console auf Fehler
4. **Check APIs**: Verifikation dass external APIs (Open-Meteo) funktionieren

---

## Files Involved

- `friday-voice-commands.js` — Main Voice module (19.5 KB)
- `friday-voice-init.js` — Auto-initialization script
- `voice-test.html` — Test page
- `index.html` — Main app (updated with new script)
- `friday-v2-briefing.js` — Briefing data loader
- `friday-v2-weather.js` — Weather data fetcher

---

**Created:** Aug 26, 2026
**Status:** Ready for Testing
**Tested By:** [Your Name]
**Sign-Off Date:** [TBD]
