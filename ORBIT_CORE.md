# ORBIT CORE

## Zweck

ORBIT CORE ist das zentrale Fundament des ORBIT-Projekts.

## FRIDAY Profil

FRIDAY ist extrem effizient, loyal und pragmatisch. Sie unterstützt Mr. Stark mit messerscharfen Analysen, bleibt auch in Krisensituationen ruhig und arbeitet konsequent lösungsorientiert.

Ihr Ton ist souverän, präzise und situationsgerecht. Sie darf schlagfertig, trocken und humorvoll reagieren, ohne albern zu wirken oder den Fokus zu verlieren. Humor ist ein Werkzeug, kein Selbstzweck.

FRIDAY verhält sich wie eine verlässliche operative Assistentin:

- analysiert schnell und priorisiert das Wesentliche
- bleibt unter Druck ruhig und klar
- weist auf Risiken, Fehlerquellen und Widersprüche hin
- spricht Empfehlungen deutlich aus, statt nur Möglichkeiten aufzuzählen
- schützt vor unnötiger Komplexität und Verzettelung
- handelt pragmatisch und bevorzugt robuste, einfache Lösungen
- bleibt loyal zum Ziel und zur vereinbarten Arbeitsweise
- darf bei passender Gelegenheit mit trockenem, schlagfertigem Humor reagieren
- wechselt situationsgerecht zwischen „Boss“, „Mister Stark“ und neutralen Formulierungen
- wird bei überfälligen oder kritischen Punkten automatisch ernster und direkter

## Grundregel

Eine Mission nach der anderen. Eine Mission wird erst abgeschlossen, bevor die nächste beginnt.

## Aktive Mission

Mission 19 — **FRIDAY Stimme V1 / Startsequenz-Abnahme**.

FRIDAY erhält eine echte deutsche Sprachausgabe mit dynamischem Lagebericht, persönlicher Ansprache, synchronem Voice-Core und robuster Fallback-Kette. Beim Start werden – sofern verbunden – Live-Daten aus Gmail, Kalender und ORBIT-Aufgaben in die Ansage eingebaut. Die private Hintergrundmusik bleibt außerhalb des öffentlichen Repositories. Der Startscreen wird gegen die vereinbarte 3D-/Motion-Referenz abgenommen und nicht mehr nur kosmetisch verändert.

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
18. **FRIDAY Startscreen V2** — hochwertiger Rot-Gold-Startscreen mit Voice-Core/Orb, Idle- und Sprechzustand sowie Desktop-/iPhone-Abnahme

## Mission 19 — Implementierungsstand

FRIDAY Stimme V1 ist im App-Master weitgehend umgesetzt:

- Seraphina HD über das sichere Voice-Gateway als bevorzugte Stimme
- Voice-Gateway am 25. August 2026 auf klarere Artikulation angepasst: weniger künstliche Tiefe, neutralere Geschwindigkeit, größerer natürlicher Stimmumfang
- deutsche Browserstimme als Fallback
- wechselnde Ansprache nach Tageszeit und Situation
- „Boss“ und „Mister Stark“ werden passend und nicht schematisch eingesetzt
- ernster Modus bei überfälligen Aufgaben
- dynamischer Start-/Lagebericht
- Gmail-Anzahl wird aus Live-Daten übernommen, wenn Google verbunden ist
- heutige Kalendertermine werden in den Lagebericht übernommen
- offene und überfällige ORBIT-Aufgaben fließen in den Lagebericht ein
- Voice-Orb reagiert während der tatsächlichen Sprachausgabe
- private Hintergrundmusik bleibt außerhalb des öffentlichen Repositories
- Musik-Ducking während der Sprachausgabe ist vorgesehen
- synthetische Boot-Ambience bleibt als Fallback erhalten
- private Assets und lokale Geheimnisse sind über `.gitignore` geschützt
- private Asset-Struktur ist in `interface/app/PRIVATE_ASSETS.md` dokumentiert
- Startscreen wurde zuletzt auf einen perspektivischen 3D-Mehrschicht-Aufbau umgestellt und Cache-Version auf V16 erhöht

Mission 19 bleibt bis zur finalen Desktop-/iPhone-Abnahme **aktiv**.

## Arbeitsprinzip

1. Mission klar definieren.
2. Genau diese Mission bearbeiten.
3. Ergebnis selbst prüfen, soweit technisch möglich.
4. Nichts als fertig bezeichnen, bevor es sichtbar funktioniert.
5. Nutzer nicht nach Dingen suchen oder prüfen lassen, die selbst über Tools geprüft werden können.
6. Ergebnis prüfen.
7. Mission abschließen.
8. Erst danach die nächste Mission starten.

## Backlog

- Gmail-Funktionen weiter vertiefen: wichtige Nachrichten erkennen, priorisieren und später gezielt zusammenfassen.
- Neue Ideen und Nebenaufgaben werden gesammelt und nicht während einer aktiven Mission begonnen.

## Checkpoint — 25. August 2026, 00:05 Uhr

Der aktuelle produktive ORBIT-Stand läuft über Vercel aus `main`. Der vorher verwendete alte Deployment-Link war verwaist; der aktuelle Produktionsstand wurde anschließend korrekt geladen.

Der Nutzer hat den aktuellen Startscreen per Video geprüft. Ergebnis: Der neue Screen ist zwar perspektivischer, erfüllt die vereinbarte 3D-/Motion-Referenz aber noch **nicht**. Er wirkt noch zu sehr wie eine gekippte HUD-Platte. Für die nächste Sitzung gilt daher ausdrücklich:

- keine kosmetischen Mini-Änderungen
- echte räumliche Tiefenwirkung mit Vorder-/Hintergrundebenen
- schwebende HUD-Elemente und Core im Raum
- stärkere Licht-/Energiebewegung
- räumliche Parallaxe statt bloßer Rotation
- Ergebnis selbst gegen die Referenz prüfen, bevor es als passend bezeichnet wird

Stimme: grundsätzlich funktionsfähig, längere Statusansagen klangen zuletzt etwas verwaschen; das Voice-Gateway wurde daraufhin auf klarere Artikulation angepasst und ist in Version 8 aktiv.

Musik: gewünschter privater Track ist vorbereitet, aber im produktiven Web-Start noch nicht hörbar. Der öffentliche GitHub-/Vercel-Stand enthält die private Audiodatei bewusst nicht. Die private Musik-Einbindung bleibt daher offen und wird erst zusammen mit der finalen Startsequenz sauber abgeschlossen.

## Nächster Kontrollpunkt

**Nur eine Mission:** FRIDAY-Startsequenz nach der 3D-Referenz fertigstellen. Reihenfolge beim nächsten Weiterarbeiten:

1. 3D-Startscreen gegen Referenz sichtbar auf Zielniveau bringen.
2. Danach privaten Musik-Track zuverlässig in der persönlichen ORBIT-Nutzung aktivieren.
3. Danach klare deutsche FRIDAY-Ansage mit Live-Lagebericht abnehmen.
4. Erst wenn alle drei Punkte gemeinsam funktionieren, Mission 19 abschließen und den finalen Checkpoint setzen.

## Nächste Mission

Erst nach Abschluss und Abnahme von Mission 19 festlegen.
