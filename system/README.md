# ORBIT CORE — System

## Zweck

Der `system/`-Bereich enthält die technischen Komponenten, Automatisierungen und Integrationen von ORBIT.

## Verantwortungsbereich

- technische Dienste und Komponenten
- Automatisierungen
- externe Integrationen und Konnektoren
- Datenflüsse zwischen klar definierten Systemgrenzen
- technische Laufzeit- und Betriebslogik

## Grundsatz

Technik wird modular aufgebaut. Jede Komponente erhält eine eindeutige Aufgabe, klar beschriebene Ein- und Ausgaben sowie eine nachvollziehbare Verbindung zu den anderen ORBIT-Ebenen.

## Abgrenzung

Zentrale Identität, Regeln und Zustände gehören in `core/`. Aktive Aufgaben gehören in `missions/`. Dauerhaftes Wissen gehört in `knowledge/`. Benutzeroberflächen und Kommunikationswege gehören in `interface/`.

## Status

Mission 2 — Architektur-Grundstruktur: **Abgeschlossen**

Erster Bereich definiert: `system/`
