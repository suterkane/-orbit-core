# Mission 13 — Aufgaben-Fälligkeit V1

## Ziel

Aufgaben mit einem optionalen Fälligkeitsdatum versehen und zeitkritische Einträge im ORBIT-Eingang sofort erkennbar machen.

## Ergebnis

- Die Kategorie **Aufgabe** blendet bei der Erfassung ein optionales Datumsfeld ein.
- Das Fälligkeitsdatum wird dauerhaft gespeichert.
- Bestehende Einträge bleiben unverändert.
- Das Datum kann beim Bearbeiten ergänzt, geändert oder entfernt werden.
- Friday kennzeichnet Aufgaben als **HEUTE FÄLLIG**, **ÜBERFÄLLIG** oder mit dem konkreten Termin.
- Gedanken und Ideen erhalten bewusst kein Fälligkeitsdatum.
- Der mobile Dialog bleibt ohne horizontalen Überlauf.

## Technische Umsetzung

Die persistente Erfassung wurde um das optionale Feld `due_date` erweitert. Eine additive Datenbankmigration ergänzt die bestehende Tabelle ohne Datenverlust. API und Oberfläche validieren die Zuordnung, sodass nur Aufgaben ein Fälligkeitsdatum führen.

## Prüfung

- Produktions-Build erfolgreich
- Codeprüfung ohne Fehler
- Datumsfeld auf Desktop und iPhone-Breite geprüft
- Mobile Breite: Inhalt und sichtbarer Bereich identisch
- Produktions-Deployment erfolgreich

## Status

Abgeschlossen am 18. August 2026.
