# ORBIT CORE — Architektur

## Ziel

Dieses Dokument definiert die erste technische Grundstruktur von ORBIT CORE.

## Ebenen

### 1. CORE
Zentrale Regeln, Zustände und Identität von ORBIT.

### 2. MISSIONS
Konkrete Aufgaben, die einzeln geplant, bearbeitet und abgeschlossen werden.

### 3. KNOWLEDGE
Wissen, Dokumentation und dauerhaft relevante Inhalte.

### 4. SYSTEM
Technische Komponenten, Automatisierung und Integrationen.

### 5. INTERFACE
Die späteren Benutzeroberflächen und Kommunikationswege von ORBIT.

## Grundsatz

Die Ebenen werden getrennt aufgebaut. Neue Komponenten werden erst ergänzt, wenn ihre Aufgabe und ihr Platz in der Architektur klar sind.

## Erste Verzeichnisstruktur

```text
ORBIT CORE
├── core/        # Identität, Regeln und zentraler Zustand
├── missions/    # Missionen und deren Lebenszyklus
├── knowledge/   # Wissen und dauerhafte Dokumentation
├── system/      # Technik, Automatisierung und Integrationen
└── interface/   # Benutzeroberflächen und Kommunikationswege
```

Die Verzeichnisse bilden zunächst die logische Architektur ab. Konkrete Implementierungen werden erst in den jeweils zuständigen Missionen ergänzt.

## Architekturregel

Jede Komponente gehört eindeutig zu einer Ebene. Abhängigkeiten zwischen Ebenen werden bewusst definiert und nicht zufällig durch die Implementierung erzeugt.

## Status

Mission 2 — Architektur-Grundstruktur: **In Arbeit**

### Erledigter Schritt

Die logische Verzeichnisstruktur für die fünf ORBIT-Kernebenen ist definiert.
