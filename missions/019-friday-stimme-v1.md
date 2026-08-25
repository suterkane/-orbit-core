# Mission 19 — FRIDAY Stimme V1

## Ziel

FRIDAY erhält eine erste echte Sprachausgabe. Beim Start spricht FRIDAY eine kurze Begrüßung, während der Voice-Orb sichtbar synchron reagiert.

## Umfang

- browserbasierte Sprachausgabe über Speech Synthesis
- deutsche Stimme bevorzugen
- Begrüßung abhängig von der Tageszeit
- Voice-Orb während der tatsächlichen Sprachausgabe aktivieren
- Zentrale erst nach Ende der Begrüßung öffnen
- sauberer Fallback auf Geräten ohne Sprachausgabe
- bestehende ORBIT-Funktionen und Cloud-Sync nicht beeinträchtigen
- Voice Core mit deutscher Spracheingabe über den Browser
- laufende FRIDAY-Ausgabe vor dem Zuhören unterbrechen
- erste Sprachbefehle für Navigation, Status und Erfassung
- lokale Neural-Antworten ohne zusätzlichen kostenpflichtigen Dienst
- Desktop- und iPhone-Endtest

## Abnahmekriterien

- INITIATE löst eine hörbare deutsche Begrüßung aus, sofern das Gerät Sprachausgabe unterstützt
- der Voice-Orb ist während der Ausgabe sichtbar aktiv
- nach Ende der Begrüßung öffnet sich die Zentrale zuverlässig
- ohne Speech-Synthesis-Unterstützung bleibt der Start funktionsfähig
- Desktop und iPhone funktionieren ohne Layoutfehler
- ORBIT Sync bleibt stabil

## Status

**Abgeschlossen und von Rene am 25. August 2026 auf dem iPhone abgenommen.** Begrüßung, Neuralstimme, Voice Core, Mikrofonfluss und Sprachtempo funktionieren im produktiven PWA-Stand.
