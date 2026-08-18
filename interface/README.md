# ORBIT CORE — Interface

## Zweck

Der `interface/`-Bereich enthält die Benutzeroberflächen und Kommunikationswege von ORBIT.

## Verantwortungsbereich

- Desktop-Oberfläche und Kontrollzentrum
- mobile Suche und Datenerfassung
- Sprach- und Texteingabe
- visuelle Rückmeldungen und Statusanzeigen
- klar definierte Übergaben an `core/` und `system/`

## Aktiver Masterstand

Die rekonstruierte ORBIT-App liegt unter `interface/app/`.

Enthalten sind:

- FRIDAY Rot-Gold-Startbildschirm als neuer visueller Masterstil
- responsive Zentrale für Desktop und iPhone
- lokale dauerhafte Speicherung per `localStorage`
- Schnellerfassung
- Eingang mit Suche
- Gedanken, Aufgaben und Ideen als Kategorien
- Bearbeiten, Wichtig-Markierung, Erledigen und zweistufiges Löschen
- optionale Aufgaben-Fälligkeiten
- Filter für heute, überfällig und geplant
- Tageslage
- nächster Fokus
- Mission 17: Wochenblick für Tag +1 bis Tag +7 ohne Doppelzählung von heute/überfällig
- installierbare PWA-Grundlage und Offline-Shell

## Dateien

```text
interface/app/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
└── service-worker.js
```

## Grundsatz

Die Oberfläche bleibt von der technischen Ausführung getrennt. Sie zeigt Zustände verständlich an, nimmt Befehle kontrolliert entgegen und löst ausschließlich klar definierte ORBIT-Funktionen aus.

## Nutzungsschwerpunkt

Die vollständige Arbeits- und Kontrolloberfläche ist für den Desktop vorgesehen. Die responsive App unterstützt zugleich iPhone-Nutzung für Schnellerfassung, Suche, Aufgabenstatus und kompakte Lageinformationen.

## Abgrenzung

Zentrale Regeln und Zustände gehören in `core/`. Missionen gehören in `missions/`. Wissen gehört in `knowledge/`. Technische Komponenten und Integrationen gehören in `system/`.

## Status

Rekonstruktion des App-Masterstands: **Im Repository vorhanden**.

Nächster technischer Kontrollpunkt: Deployment und Endprüfung von Mission 17.