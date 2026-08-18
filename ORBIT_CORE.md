# ORBIT CORE

## Zweck

ORBIT CORE ist das zentrale Fundament des ORBIT-Projekts.

## Grundregel

Eine Mission nach der anderen. Eine Mission wird erst abgeschlossen, bevor die nächste beginnt.

## Aktive Mission

Mission 17 — **Wochenblick V1**.

Friday erweitert die Zentrale um einen kompakten Überblick über offene Aufgaben, die in den kommenden sieben Tagen anstehen. Der Wochenblick führt direkt zu den betroffenen Aufgaben und ergänzt die bestehende Tageslage, ohne heutige oder überfällige Aufgaben doppelt zu zählen.

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

## Rekonstruktions-Checkpoint — 18. August 2026

Der zuvor laufende App-Quellstand war weder im alten Interface-Ordner noch im verbundenen Vercel-Team vollständig greifbar. Deshalb wurde der ORBIT-App-Master kontrolliert rekonstruiert und wieder im GitHub-Repository gesichert.

Neuer App-Master:

`interface/app/`

Enthalten sind die Funktionen der Missionen 3 bis 16 sowie die Implementierung von Mission 17, darunter Schnellerfassung, Eingang, Suche, Kategorien, Wichtig-Markierung, Bearbeitung, zweistufiges Löschen, Aufgaben-Fälligkeiten, Terminfilter, Tageslage, nächster Fokus und Wochenblick.

Der neue visuelle Masterstil ist **FRIDAY Rot/Gold** auf dunkler Oberfläche. Die App ist responsive, nutzt lokale dauerhafte Speicherung und besitzt eine installierbare PWA-/Offline-Grundlage.

## Mission 17 — Implementierungsstand

Der Wochenblick ist im rekonstruierten App-Code umgesetzt:

- gezählt werden offene Aufgaben mit Fälligkeit von Tag +1 bis Tag +7
- heutige und überfällige Aufgaben werden nicht doppelt gezählt
- erledigte Aufgaben werden ausgeschlossen
- Antippen führt in den Wochenfilter
- ein leerer Wochenblick bleibt ruhig und eindeutig

Mission 17 bleibt bis zur Deployment- und Endkontrolle **aktiv**.

## Arbeitsprinzip

1. Mission klar definieren.
2. Genau diese Mission bearbeiten.
3. Ergebnis prüfen.
4. Mission abschließen.
5. Erst danach die nächste Mission starten.

## Backlog

- Gmail in Friday einbinden, sobald die Gmail-Verbindung echte Postfachdaten liefert.
- Neue Ideen und Nebenaufgaben werden gesammelt und nicht während der aktiven Mission begonnen.

## Nächster Kontrollpunkt

Den rekonstruierten Master deployen, auf Desktop und iPhone prüfen und Mission 17 erst danach abnehmen.

## Nächste Mission

Erst nach Abschluss und Abnahme von Mission 17 festlegen.
