# ORBIT CORE — Interface

## Zweck

Der `interface/`-Bereich enthält die Benutzeroberflächen und Kommunikationswege von ORBIT.

## Verantwortungsbereich

- Desktop-Oberfläche und Kontrollzentrum
- mobile Suche und Datenerfassung
- Sprach- und Texteingabe
- visuelle Rückmeldungen und Statusanzeigen
- klar definierte Übergaben an `core/` und `system/`

## Grundsatz

Die Oberfläche bleibt von der technischen Ausführung getrennt. Sie zeigt Zustände verständlich an, nimmt Befehle kontrolliert entgegen und löst ausschließlich klar definierte ORBIT-Funktionen aus.

## Nutzungsschwerpunkt

Die vollständige Arbeits- und Kontrolloberfläche ist für den Desktop mit zwei Monitoren vorgesehen. Mobil konzentriert sich ORBIT zunächst auf Suche, schnelle Datenerfassung und kompakte Statusinformationen.

## Abgrenzung

Zentrale Regeln und Zustände gehören in `core/`. Missionen gehören in `missions/`. Wissen gehört in `knowledge/`. Technische Komponenten und Integrationen gehören in `system/`.

## Status

Mission 2 — Architektur-Grundstruktur: **In Arbeit**

Erster Bereich definiert: `interface/`
