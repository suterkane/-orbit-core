# PANORAMA-Wings: Quick Start Guide

## 🚀 Installation & Konfiguration (3 Minuten)

### 1. Dateien verifizieren
Folgende Dateien sollten im `/interface/app` Verzeichnis existieren:

```bash
✓ panorama-wings.js     (neu)
✓ panorama.css          (aktualisiert)
✓ index.html            (aktualisiert)
```

### 2. Lokalen Server starten

```bash
cd C:/Users/Rene/-orbit-core/interface/app
python -m http.server 8765
```

**Erwartete Ausgabe:**
```
Serving HTTP on 0.0.0.0 port 8765 (http://0.0.0.0:8765/)
```

### 3. Panorama-View öffnen

**Browser-URL:**
```
http://127.0.0.1:8765/index.html?panorama=dual
```

**Oder mit Chrome-App-Modus (5120×1440):**
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --app="http://127.0.0.1:8765/index.html?panorama=dual" ^
  --window-position=0,0 ^
  --window-size=5120,1440 ^
  --force-device-scale-factor=1
```

### 4. Verifizieren, dass es funktioniert

Öffne die Browser-Console (F12):

```javascript
// Sollte Daten zeigen
ORBITPanoramaWings.telemetry()

// Output ähnlich wie:
{
  state: {
    crypto: { BTC: { price: 42345.50, change: 2.5 }, ... },
    weather: { temp: 22, weather: "☀ Klar", wind: 5 },
    gmail: { unread: 3, status: "3 ungelesen" },
    tasks: { today: 5, overdue: 0, total: 12 },
    vault: { focus: "ORBIT · FRIDAY", mission: "Mission 21", ... }
  },
  refreshTasks: ['vault', 'crypto', 'gmail', 'weather', 'tasks'],
  active: true
}
```

---

## 🎯 Visuelle Features nutzen

### Left Wing (Tageslage)
```
┌──────────────────────┐
│ FRIDAY / TAGESLAGE   │
│ Willkommen zurück.   │
├──────────────────────┤
│ WETTER               │
│ 22° ☀ Klar           │
│ Wind 5 km/h          │
├──────────────────────┤
│ VAULT FOCUS          │
│ ORBIT · FRIDAY       │
│ Mission 21 · Begleit │
├──────────────────────┤
│ ⚠ NÄCHSTE PRIORITÄT  │
│ Keine Aufgabe        │
│ Bereit für Auftrag   │
└──────────────────────┘
```

### Right Wing (Kommunikation)
```
┌──────────────────────┐
│ ORBIT / KOMMUNIKATION│
│ Systeme online.      │
├──────────────────────┤
│ GMAIL STATUS         │
│ Posteingang aktuell  │
│ ●3 Ungelesen        │
├──────────────────────┤
│ AUFGABEN-COUNTER     │
│ 12 offen             │
│ 5 heute · 0 überfällig
├──────────────────────┤
│ 📊 CRYPTO LIVE       │
│ BTC € 42,345 📈+2.5% │
│ ETH € 2,245  📈+1.8% │
│ SOL € 145    📉-0.3% │
└──────────────────────┘
```

### Hover-Effekte
- **Wings heben sich** 8px nach oben
- **Border glüht** cyan auf
- **Background wird heller**
- **Crypto-Items verschieben** sich rechts

---

## ⚙️ Konfigurieren

### Refresh-Intervalle anpassen

**Datei:** `panorama-wings.js` (Zeilen 9-15)

```javascript
const REFRESH_INTERVALS = {
  vault: 600000,      // 10 Minuten → ändern zu z.B. 300000 (5 min)
  crypto: 30000,      // 30 Sekunden (LIVE - nicht zu schnell!)
  gmail: 300000,      // 5 Minuten
  weather: 600000,    // 10 Minuten
  tasks: 120000       // 2 Minuten
};
```

**Nach Änderung:** Browser neuladen (F5)

### Standort für Wetter ändern

**Datei:** `panorama-wings.js` (Zeile 81)

```javascript
const lat = 52.52, lon = 13.40; // Berlin aktuell
// Zu z.B.: lat = 48.8566, lon = 2.3522; // Paris
// Oder: lat = 40.7128, lon = -74.0060; // New York
```

### Crypto-Symbole wechseln

**Datei:** `panorama-wings.js` (Zeile 16)

```javascript
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL']; // Aktuell
// Ändern zu: ['BTC', 'ETH', 'XRP'] oder beliebig
// Verfügbar: Alle CoinGecko-Symbole
```

---

## 📊 Live-Daten richtig interpretieren

### Wetter-Symbole
```
☀  = Klar
🌤  = Meist klar
⛅ = Teilweise bewölkt
☁  = Bewölkt
🌫  = Neblig
🌧  = Regen
⛈  = Gewitter
❄  = Schnee
```

### Aufgaben-Status
```
Überfall (rot)  = Muss sofort erledigt werden
Heute (cyan)    = Muss heute bis EOD erledigt werden
Geplant (grau)  = Ist geplant, aber nicht urgent
```

### Crypto-Trends
```
📈 Grün = Preis gestiegen in letzten 24h
📉 Rot  = Preis gesunken in letzten 24h
```

---

## 🔧 Troubleshooting

### Problem: Wings sind nicht sichtbar

**Lösung 1:** URL-Parameter prüfen
```javascript
// Öffne Console und prüfe:
new URLSearchParams(location.search).get('panorama')
// Sollte: "dual" anzeigen
```

**Lösung 2:** Display-Auflösung prüfen
```javascript
// Console:
innerWidth // Sollte ≥ 2560px sein (für 5120×1440)
```

**Lösung 3:** CSS aktivieren
```javascript
// Console:
document.querySelector('.panorama-left').style.display
// Sollte: "block" sein (nicht "none")
```

---

### Problem: Crypto-Daten laden nicht

**Mögliche Gründe:**
1. CoinGecko API ist Down → Fehler in Console
2. Netzwerk-Fehler → Fallback-Werte werden verwendet
3. Browser-Fehler → F12 Console prüfen

**Lösung:**
```javascript
// In Console:
await ORBITPanoramaWings.fetchCrypto()
// Gibt Fehler oder neue Daten zurück
```

---

### Problem: Browser ist zu langsam

**Schnellere Intervalle setzen:**
```javascript
// Crypto nur noch 1x pro Minute statt 30sec:
// panorama-wings.js Zeile 12 ändern:
// crypto: 60000,
```

**oder:**
```javascript
// Refreshes stoppen:
ORBITPanoramaWings.stopRefreshes()
// Nur einzelne Fetches triggern:
ORBITPanoramaWings.fetchWeather()
```

---

## 📈 Performance Tipps

### 1. Intervalle optimieren
```javascript
// Standard: sehr responsiv
crypto: 30000      // 30 Sekunden

// Optimiert: weniger API-Load
crypto: 60000      // 1 Minute
```

### 2. API-Calls reduzieren
```javascript
// Vault-Sync nur wenn nötig:
vault: 1800000     // 30 Minuten statt 10
```

### 3. Browser-DevTools nutzen
- **Network-Tab:** Sieht alle API-Requests
- **Console-Tab:** Zeigt Fehler & Logs
- **Performance-Tab:** Misst Lade-Zeiten

---

## 📱 Mobile / nicht-Panorama Geräte

**Automatisches Fallback:**
- Aspect-Ratio < 3:1 (z.B. normale Monitore)
- Wings werden verborgen
- Dashboard wird normal angezeigt
- Keine Fehler, alles funktioniert

**Beispiel:**
```
5120×1440 (≥ 3:1)   → Wings sichtbar ✓
1920×1080 (≈ 1.77:1) → Fallback ✓
768×1024 (< 1:1)    → Mobile Fallback ✓
```

---

## 🎨 Styling anpassen

### Farben ändern

**Datei:** `panorama.css` (Top)

```css
/* Cyan → eigene Farbe */
--color-accent: #00e5ff;  /* Cyan (aktuell) */

/* Orange → eigene Farbe */
--color-accent-alt: #ff9500;  /* Orange (aktuell) */
```

### Font-Größen ändern

```css
/* Wings-Titel */
.panorama-wing h2 {
  font-size: 42px;  /* Zu groß? Auf 32px reduzieren */
}

/* Module-Inhalt */
.wing-module strong {
  font-size: 22px;  /* Zu klein? Auf 28px erhöhen */
}
```

### Animation-Geschwindigkeit ändern

```css
/* Wings erscheinen langsamer */
.panorama-wing {
  animation: wingEntrance 1000ms ease forwards;  /* 640ms → 1000ms */
}

/* Hover-Effekt schneller */
.panorama-wing:hover {
  transition: all 150ms ease;  /* 280ms → 150ms */
}
```

---

## 📚 Zusätzliche Ressourcen

### APIs
- **Open-Meteo**: https://open-meteo.com/ (kostenlos, EU)
- **CoinGecko**: https://www.coingecko.com/api (kostenlos, keine Auth)

### Dokumentation
- **CSS Grid**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
- **Backdrop Filter**: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Browser DevTools
- Chrome: F12 oder Rechtsklick → Untersuchen
- Firefox: F12 oder Rechtsklick → Element untersuchen
- Edge: F12 oder Rechtsklick → Element untersuchen

---

## ✨ Nächste Schritte

1. **Server auf andere Ports testen**
   ```bash
   python -m http.server 3000
   ```

2. **Auf verschiedene Bildschirmgrößen testen**
   - 5120×1440 (Ultra-Breite)
   - 3840×2160 (4K)
   - 1920×1080 (Full HD)

3. **Custom-Konfiguration speichern**
   ```javascript
   // localStorage speichert Einstellungen
   localStorage.setItem('orbit.refresh.crypto', '60000');
   ```

4. **Deploy auf Production**
   - Minification: `terser` für .js, `cssnano` für .css
   - Caching: Cache-Control Headers setzen
   - CDN: Assets auf CDN pushen

---

**Viel Spaß mit PANORAMA-Wings! 🚀**
