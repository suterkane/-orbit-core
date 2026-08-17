# ORBIT CORE — Missions

## Zweck

Der `missions/`-Bereich enthält die konkreten Aufgaben von ORBIT.

Jede Mission beschreibt ein klar abgegrenztes Ziel und wird einzeln bearbeitet.

## Lebenszyklus einer Mission

1. Mission definieren
2. Mission starten
3. Mission bearbeiten
4. Ergebnis prüfen
5. Mission abschließen

## Grundregel

Es wird immer nur **eine Mission gleichzeitig** aktiv bearbeitet.

Neue Ideen oder Nebenaufgaben werden während einer laufenden Mission nicht begonnen. Sie werden stattdessen im Backlog gesammelt.

## Statusmodell

- `planned` — geplant, noch nicht gestartet
- `active` — aktuell in Arbeit
- `completed` — erfolgreich abgeschlossen
- `blocked` — wartet auf eine notwendige Voraussetzung

## Abgrenzung

Technische Komponenten gehören in `system/`, Wissen in `knowledge/`, zentrale Regeln und Zustände in `core/` und Benutzeroberflächen in `interface/`.

## Status

Mission 2 — Architektur-Grundstruktur: **Abgeschlossen**

Erster Bereich definiert: `missions/`
