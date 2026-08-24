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

Mission 19 — **FRIDAY Stimme V1**.

FRIDAY erhält eine echte deutsche Sprachausgabe mit dynamischem Lagebericht, persönlicher Ansprache, synchronem Voice-Core und robuster Fallback-Kette. Beim Start werden – sofern verbunden – Live-Daten aus Gmail, Kalender und ORBIT-Aufgaben in die Ansage eingebaut. Die private Hintergrundmusik bleibt außerhalb des öffentlichen Repositories.

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

## Rekonstruktions-Checkpoint — 18. August 2026

Der zuvor laufende App-Quellstand war weder im alten Interface-Ordner noch im verbundenen Vercel-Team vollständig greifbar. Deshalb wurde der ORBIT-App-Master kontrolliert rekonstruiert und wieder im GitHub-Repository gesichert.

Neuer App-Master:

`interface/app/`

Enthalten sind die Funktionen der Missionen 3 bis 18, darunter Schnellerfassung, Eingang, Suche, Kategorien, Wichtig-Markierung, Bearbeitung, zweistufiges Löschen, Aufgaben-Fälligkeiten, Terminfilter, Tageslage, nächster Fokus, Wochenblick, geräteübergreifender ORBIT Sync sowie FRIDAY Startscreen V2.

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

## Mission 18 — Abschlussstand

FRIDAY Startscreen V2 wurde am 18. August 2026 abgeschlossen und abgenommen:

- hochwertiger Startscreen im dunklen Rot-/Schwarz-Look mit Goldakzenten
- zentraler FRIDAY Voice-Core / Orb
- ruhiger Idle-Zustand
- sichtbarer Sprech-/Verbindungszustand beim Start
- technischer Hook `ORBITFriday.setSpeaking(...)` für spätere echte Sprachausgabe
- Desktop-Produktion erfolgreich ausgerollt und Cache-Problem bereinigt
- iPhone-Darstellung ohne horizontales Verschieben geprüft
- INITIATE funktioniert zuverlässig
- bestehender ORBIT Sync und App-Kern bleiben stabil

Mission 18 ist **abgeschlossen**.

## Mission 19 — Implementierungsstand

FRIDAY Stimme V1 ist im App-Master weitgehend umgesetzt:

- Seraphina HD über das sichere Voice-Gateway als bevorzugte Stimme
- deutsche Browserstimme als Fallback
- wechselnde Ansprache nach Tageszeit und Situation
- „Boss“ und „Mister Stark“ werden passend und nicht schematisch eingesetzt
- ernster Modus bei überfälligen Aufgaben
- dynamischer Start-/Lagebericht
- Gmail-Anzahl wird aus Live-Daten übernommen, wenn Google verbunden ist
- heutige Kalendertermine werden in den Lagebericht übernommen
- offene und überfällige ORBIT-Aufgaben fließen in den Lagebericht ein
- Voice-Orb reagiert während der tatsächlichen Sprachausgabe
- private Hintergrundmusik wird bevorzugt aus `interface/app/private-assets/friday-theme.m4a` geladen
- Musik wird während der Sprachausgabe automatisch abgesenkt
- synthetische Boot-Ambience bleibt als Fallback erhalten
- private Assets und lokale Geheimnisse sind über `.gitignore` geschützt
- private Asset-Struktur ist in `interface/app/PRIVATE_ASSETS.md` dokumentiert

Mission 19 bleibt bis zur finalen Desktop-/iPhone-Abnahme **aktiv**.

## Arbeitsprinzip

1. Mission klar definieren.
2. Genau diese Mission bearbeiten.
3. Ergebnis prüfen.
4. Mission abschließen.
5. Erst danach die nächste Mission starten.

## Backlog

- Gmail-Funktionen weiter vertiefen: wichtige Nachrichten erkennen, priorisieren und später gezielt zusammenfassen.
- Neue Ideen und Nebenaufgaben werden gesammelt und nicht während einer aktiven Mission begonnen.

## Checkpoint — 24. August 2026

FRIDAY Voice/Personality wurde konsolidiert und im Repository gesichert. Code, private Asset-Regeln, Live-Briefing und Persönlichkeit sind dokumentiert. Der öffentliche Quellstand enthält keine private Musikdatei.

## Nächster Kontrollpunkt

Private Musik lokal als `interface/app/private-assets/friday-theme.m4a` einsetzen, aktuellen App-Stand laden und auf Desktop sowie iPhone prüfen: Musik, Seraphina-HD-Stimme, dynamischer Lagebericht, Voice-Core und Übergang in die Zentrale.

## Nächste Mission

Erst nach Abschluss und Abnahme von Mission 19 festlegen.
