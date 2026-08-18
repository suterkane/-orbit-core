# ORBIT CORE

## Zweck

ORBIT CORE ist das zentrale Fundament des ORBIT-Projekts.

## Grundregel

Eine Mission nach der anderen. Eine Mission wird erst abgeschlossen, bevor die nächste beginnt.

## Aktive Mission

Mission 18 — **FRIDAY Startscreen V2**.

Der ORBIT-Start wird visuell auf die festgelegte FRIDAY-Richtung angehoben: dunkles Rot/Schwarz, dezente Goldakzente, zentraler Voice-Core/Orb und ein sichtbarer Sprechzustand. Desktop und iPhone werden gemeinsam abgenommen; bestehende Kernfunktionen und ORBIT Sync bleiben unangetastet.

## Abgeschlossene Missionen

1. **ORBIT CORE Grundgerüst** — Fundament und Arbeitsregeln
2. **Architektur-Grundstruktur** — fünf getrennte Kernebenen
3. **ORBIT App-Kern V1** — erste ausführbare Kontrollzentrale
4. **Schnellerfassung V1** — gemeinsame mobile und Desktop-Erfassung
5. **ORBIT-Eingang V1** — offene und erledigte Einträge verarbeiten
6. **Mobiler App-Start V1** — ORBIT vom iPhone-Home-Bildschirm starten
7. **Mobile Navigation V1** — Zentrale, Missionen, Eingang und System mit einer Hand erreichen
8. **Gedankenbearbeitung V1** — gespeicherte Gedanken direkt korrigieren und ergänzen
9. **Gedankensuche V1** — offene und erledigte Einträge nach Inhalt durchsuchen
10. **Wichtige Gedanken V1** — Einträge dauerhaft markieren und automatisch oben halten
11. **Gedanken löschen V1** — nicht mehr benötigte Einträge nach einer Sicherheitsabfrage dauerhaft entfernen
12. **Gedanken-Kategorien V1** — Einträge dauerhaft als Gedanke, Aufgabe oder Idee einordnen, filtern und nachträglich ändern
13. **Aufgaben-Fälligkeit V1** — Aufgaben optional mit einem Datum versehen und heutige sowie überfällige Termine direkt erkennen
14. **Terminübersicht V1** — Aufgaben nach heute, überfällig, geplant oder allen Aufgaben filtern
15. **Tageslage V1** — heutige und überfällige Aufgaben direkt auf der Zentrale anzeigen und öffnen
16. **Nächster Fokus V1** — die nächste geplante Aufgabe direkt auf der Zentrale anzeigen und öffnen
17. **Wochenblick V1** — offene Aufgaben der kommenden sieben Tage auf der Zentrale anzeigen, direkt filtern und über einen gemeinsamen Cloud-Stand auf Desktop und iPhone synchron halten

## Rekonstruktions-Checkpoint — 18. August 2026

Der zuvor laufende App-Quellstand war weder im alten Interface-Ordner noch im verbundenen Vercel-Team vollständig greifbar. Deshalb wurde der ORBIT-App-Master kontrolliert rekonstruiert und wieder im GitHub-Repository gesichert.

Neuer App-Master:

`interface/app/`

Enthalten sind die Funktionen der Missionen 3 bis 17, darunter Schnellerfassung, Eingang, Suche, Kategorien, Wichtig-Markierung, Bearbeitung, zweistufiges Löschen, Aufgaben-Fälligkeiten, Terminfilter, Tageslage, nächster Fokus, Wochenblick und geräteübergreifender ORBIT Sync.

Der visuelle Masterstil ist **FRIDAY Rot/Gold** auf dunkler Oberfläche. Die App ist responsive, besitzt eine installierbare PWA-/Offline-Grundlage und synchronisiert den ORBIT-Datenstand über ORBIT Sync zwischen PC und iPhone.

## Mission 17 — Abschlussstand

Der Wochenblick ist umgesetzt und am 18. August 2026 abgenommen:

- gezählt werden offene Aufgaben mit Fälligkeit von Tag +1 bis Tag +7
- heutige und überfällige Aufgaben werden nicht doppelt gezählt
- erledigte Aufgaben werden ausgeschlossen
- Antippen führt in den Wochenfilter
- ein leerer Wochenblick bleibt ruhig und eindeutig
- Desktop und iPhone verwenden denselben Cloud-Datenstand
- Endtest mit einer für den Folgetag geplanten Testaufgabe auf beiden Geräten bestanden

Mission 17 ist **abgeschlossen**.

## Mission 18 — Implementierungsstand

FRIDAY Startscreen V2 ist im App-Master begonnen:

- Startscreen als separate V2-Schicht umgesetzt
- dunkle Rot-/Schwarz-Basis mit feinen Goldakzenten
- zentraler FRIDAY Voice-Core / Orb
- ruhige Idle-Animation
- eigener Sprechzustand mit pulsierenden Voice-Wellen
- Steuer-Hook `ORBITFriday.setSpeaking(...)` für spätere echte Sprachausgabe
- Service Worker auf neue V2-Assets aktualisiert
- bestehender ORBIT Sync und App-Kern nicht verändert

Mission 18 bleibt bis zur Desktop-/iPhone-Endkontrolle **aktiv**.

## Arbeitsprinzip

1. Mission klar definieren.
2. Genau diese Mission bearbeiten.
3. Ergebnis prüfen.
4. Mission abschließen.
5. Erst danach die nächste Mission starten.

## Backlog

- Gmail in Friday einbinden, sobald die Gmail-Verbindung echte Postfachdaten liefert.
- Neue Ideen und Nebenaufgaben werden gesammelt und nicht während einer aktiven Mission begonnen.

## Nächster Kontrollpunkt

FRIDAY Startscreen V2 über Vercel ausrollen, auf Desktop und iPhone visuell prüfen und den Voice-Orb abnehmen.

## Nächste Mission

Erst nach Abschluss und Abnahme von Mission 18 festlegen.
