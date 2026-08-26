# FRIDAY v2 — SYSTEMCHECK beim Boot

## Zweck

Der SYSTEMCHECK ist ein transparentes Boot-Diagnose-System, das alle kritischen Module und Services prüft und klare Fehlermeldungen liefert statt Silent-Fails zu tolerieren.

**Kernprinzip:** Rene kennt jederzeit den exakten Systemstatus und kann schnell auf Probleme reagieren.

## Module die geprüft werden

| Modul | Status-Key | Kritikalität | Fallback |
|-------|-----------|--------------|----------|
| **Storage** | ORBITStorageV2 | Kritisch | LocalStorage wenn IndexedDB ausfällt |
| **Neural** | ORBITNeuralCore | Kritisch | CPU-Rendering wenn GPU nicht verfügbar |
| **Voice** | ORBITVoiceV2 | Hoch | Browser fallback voice oder stumm |
| **Briefing** | ORBITFridayBriefing | Mittel | Briefing-Funktion deaktiviert |
| **AI** | ORBITFridayAI | Kritisch | Lokal-only wenn Bridge nicht verfügbar |
| **Dashboard** | ORBITDashboardV2 | Hoch | UI wird nicht gerendert |
| **Weather** | ORBITWeatherV2 | Niedrig | Wetterdaten nicht verfügbar |

## Services die geprüft werden

- **Vault**: Cloud Sync Status (synced/pending/error)
- **Weather API**: Online-Status und letzte Aktualisierung
- **AI-Bridge**: Verbindungsstatus zum AI-Gateway

## Fehlermeldungen

Jede Fehlermeldung folgt diesem Schema:

```javascript
{
  type: 'MODULE_MISSING',        // eindeutige Fehler-ID
  severity: 'critical',           // critical | high | low
  detail: 'Beschreibung...',      // Technische Details
  action: 'Was zu tun ist...'     // Konkrete Lösungsschritte für Rene
}
```

**Keine Silent-Fails:** Wenn etwas fehlt, wird es aktiv gemeldet.

## Ausgabe beim Boot

```
🔧 FRIDAY v2 SYSTEMCHECK
Version: v2.1
Time: 2026-08-26T21:56:00Z

📦 Modules: 7/7 ✓ READY
  ✓ Storage: loaded
  ✓ Neural: loaded
  ✓ Voice: loaded
  ✓ Briefing: loaded
  ✓ AI: loaded
  ✓ Dashboard: loaded
  ✓ Weather: loaded

💾 Storage: OPERATIONAL
  ✓ IndexedDB: online
  ✓ LocalStorage: online

🧠 Neural Core: full-acceleration
  ✓ GPU: available

🎙️ Voice: READY
  ✓ Speech Synthesis: ready

🤖 AI: connected
  ✓ Bridge: connected

📊 Dashboard: READY

☁️ Vault: ✓ SYNCED
  Last sync: 26.08.2026, 21:56 Uhr

🌤️ Weather: ✓ ONLINE

⏱️ Boot check completed in 42.15ms

🟢 OPERATIONAL
```

## Fehlerausgabe Beispiel

```
❌ ERRORS (2):
  [1] MODULE_MISSING
      Severity: CRITICAL
      Detail: Expected window.ORBITStorageV2 to exist
      Action: Check if ORBITStorageV2 module script is included in index.html

  [2] STORAGE_WRITE_FAILED
      Severity: CRITICAL
      Detail: LocalStorage not writable
      Action: Check browser permissions and storage quota

⚠️ WARNINGS (1):
  [1] GPU_UNAVAILABLE
      WebGL not supported. Falling back to CPU rendering.
      Fallback: Using CPU mode (slower visuals)

🔴 CRITICAL
```

## Verwendung

### Automatischer Boot-Check

Der SYSTEMCHECK lädt automatisch, wenn die Seite ready ist:

```javascript
// Startet automatisch bei DOMContentLoaded
// Kann aber auch manuell aufgerufen werden:
window.ORBITSystemCheck.run().then(status => {
  console.log('Boot Status:', status);
});
```

### API für Anwendungen

```javascript
// Status abrufen
const status = window.ORBITSystemCheck.status();

// Detaillierte JSON-Ausgabe
const json = window.ORBITSystemCheck.details();

// Event-Listener
document.addEventListener('ORBITSystemCheckComplete', () => {
  console.log('Boot check done!');
});
```

## Konfiguration

Timeout und Module können angepasst werden:

```javascript
// In system-check.js:
const SYSTEMCHECK_VERSION = 'v2.1';
const SYSTEMCHECK_TIMEOUT = 8000; // 8 Sekunden max
const REQUIRED_MODULES = {
  'Storage': 'ORBITStorageV2',
  // ... weitere Module
};
```

## Fallback-Ketten

Wenn ein primäres System ausfällt, wird ein Fallback aktiviert:

### Storage
- Primary: IndexedDB
- Fallback: LocalStorage
- Error: Systemcheck meldet `STORAGE_WRITE_FAILED`

### Neural/GPU
- Primary: WebGL2
- Fallback: WebGL
- Degraded: CPU-Rendering (Warnung `GPU_UNAVAILABLE`)

### Voice
- Primary: ORBITVoiceV2 + Web Speech API
- Fallback: Browser speech synthesis (Warnung `VOICE_SYNTHESIS_UNAVAILABLE`)

### AI
- Primary: ORBITFridayAI + FRIDAY_AI_BRIDGE
- Fallback: Lokale KI ohne Remote-Bridge

## Testing

```bash
# Test ausführen
node tests/systemcheck.test.js

# Output:
✅ 10 SYSTEMCHECK boot verification tests passed
   - All 7 modules are checked
   - Errors are reported with type, severity, and action
   - Real system status displayed
   - Storage, Voice, Neural/GPU checked with fallback info
   - No silent error handlers
   - Status logged and exposed in window.ORBITSystemCheck
   - Timeout enforced
```

## Integration in index.html

Der SYSTEMCHECK sollte NACH allen Modul-Skripten eingebunden werden:

```html
<!-- Module -->
<script src="friday-v2-storage.js"></script>
<script src="friday-v2-neural.js"></script>
<script src="friday-v2-voice.js"></script>
<script src="friday-v2-briefing.js"></script>
<script src="friday-v2-ai.js"></script>
<script src="friday-v2-dashboard.js"></script>
<script src="friday-v2-weather.js"></script>

<!-- Boot Check -->
<script src="system-check.js"></script>
```

## Warum das wichtig ist

**Vorher:** Silent-Fails. Ein Modul lädt nicht → Keine Meldung → Features funktionieren mysteriös nicht.

**Nachher:** Klare Transparenz. Rene sieht sofort:
- Welche Module aktiv sind
- Welche Fallbacks greifen
- Wo echte Probleme sind
- Was konkret zu tun ist

**Ergebnis:** Schnellere Fehlersuche, besseres Debugging, verlässlichere App.

## Performance

Der SYSTEMCHECK läuft hauptsächlich synchron und dauert **< 50ms**. Async-Checks (Storage init, Weather fetch) laufen parallel und blockieren den Seitenstart nicht.

## Nächste Schritte

1. ✅ SYSTEMCHECK in index.html einbinden
2. ✅ Boot mit Developer Console prüfen
3. ⏳ Module einzeln deaktivieren und testen
4. ⏳ Fallback-Verhalten validieren
5. ⏳ Produktives Monitoring einrichten
