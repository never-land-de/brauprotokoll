# NOR APA Datenformat, Schema 1

Alle JSON-Dokumente verwenden `schemaVersion: 1`. Inkompatible Versionen werden nicht stillschweigend migriert. Zeiten sind ISO-8601-Zeitpunkte einschließlich Zeitzone; die Oberfläche zeigt sie in lokaler Zeit. `date` ist das lokale Braudatum `YYYY-MM-DD`. Fehlende Messwerte sind `null` oder werden als Ereignis gar nicht angelegt; ein eingegebener Wert `0` ist ein echter Nullwert.

## Rezeptvorlage

`data/templates/altbier.json` enthält `name`, `style`, `version`, `warning`, `ingredients[]`, `water`, `targets`, `checklist[]` und `steps[]`.

- Zutaten: `name`, `amount` (Zahl oder null), `unit`, `note` (einschließlich geplantem Zeitpunkt).
- Wasser: `main` und `sparge` als geplante Literwerte. Sie sind keine tatsächlichen Buchungen.
- Ziele: `volume` (l) und `extract` (°P), beide optional.
- Schritte: stabile `id`, `phase`, `title`, `instruction`, `action`, `temperature` (°C oder null), `minutes` (Minuten oder null) und optional `guard` (ID einer zuvor zu bestätigenden Zugabe).

Beim Anlegen wird das gesamte Rezept tief kopiert. Änderungen an Vorlage oder anderen Chargen wirken sich nicht rückwirkend aus. Das UI kann das Chargenrezept bearbeiten, herunterladen und als Snapshot eines weiteren Suds verwenden. Eine heruntergeladene Rezeptvorlage kann die Repository-Vorlage ersetzen; der Sicherungsimport ist ausschließlich für vollständige Chargensicherungen bestimmt.

## Private Charge und Sicherung

Eine Charge enthält:

| Feld | Bedeutung |
| --- | --- |
| `kind` | `private-batch` |
| `id` | UUID, Schlüssel in IndexedDB |
| `demo`, `fast` | Demo-Kennzeichnung, Demo-Schnelllauf |
| `createdAt`, `updatedAt` | Anlage und letzter Speicherstand |
| `name`, `style`, `number`, `date`, `description` | Editierbare Stammdaten |
| `recipe` | Eigenständiger Rezept-Snapshot |
| `checklist` | Erledigte Checklistenindizes; 99 steht für die parallele Nachgussvorbereitung |
| `steps` | Zustand je Rezeptschritt |
| `events` | Tatsächliche Messungen, Zugaben und Notizen |
| `audit` | Append-only Chronik einschließlich ursprünglicher Werte bei Korrekturen |

Schrittzustand: `id`, `status` (`open`, `active`, `done`, `skipped`), `startedAt`, `durationMs`, `completedAt`. Höchstens ein Schritt ist aktiv. Timer sind absolute Startzeit plus Dauer; es wird kein sekündlicher Restwert gespeichert. Die aktive Handlung bleibt auch nach Ablauf aktiv, bis sie bestätigt oder begründet übersprungen wird. Eine Ablaufkorrektur archiviert die vorherige Zustandsliste und setzt den gewählten und alle folgenden Schritte zurück. Mengenereignisse werden dabei nicht gelöscht oder erneut gebucht.

Ereignis: `id`, `kind`, `label`, `value`, `unit`, `method`, `text`, `at`, `public`, `deleted`; zusätzlich optional `stepId` bei einer Zugabe oder Abfüllung, die einen Schritt bestätigt. `public` ist standardmäßig false. `deleted` bedeutet nachvollziehbar zurückgenommen. Freigaben und Rücknahmen zählen zu Korrekturen und bewahren den alten Eintrag in `audit`.

Messarten: `mash-temp`, `beer-temp`, `room-temp`, `extract`, `kettle-volume`, `ferment-volume`, `bottle-volume`. Zugaben: `main-water`, `sparge-water`, `addition`. Texte: `note`, `tasting`. Extrakt wird durch Einheit und Methode identifiziert; es gibt keine methodenübergreifende Kurve oder Umrechnung.

Wasserberechnung: Summe aller nicht zurückgenommenen `main-water`-Ereignisse plus Summe aller `sparge-water`-Ereignisse. Planrest ist `max(0, Nachgussplan − Nachgusssumme)`. Ein Überschreiten wird zusätzlich als Hinweis dargestellt. Pfannevoll-, Gärbehälter- und Abfüllmenge sind unabhängige Messungen.

Sicherungsumschlag:

```json
{
  "schemaVersion": 1,
  "kind": "nor-apa-backup",
  "exportedAt": "2026-09-14T10:00:00.000Z",
  "batch": { "...": "vollständige private Charge" }
}
```

Das Beispiel ist eine Strukturerläuterung und keine importierbare Charge. Der Import prüft unter anderem Pflichtfelder, Typen, Datum/Zeit, nicht negative Zahlen, eindeutige IDs, Schrittanzahl, Zustände und Timer. Bei ID-Kollision wird eine Kopie angelegt. Unbekannte öffentliche Dokumente werden niemals als private Sicherung übernommen.

## Öffentlicher Stand

`kind: nor-apa-public`, `schemaVersion: 1`, `demo`, `publishedAt`, `name`, `style`, `number`, `date`, `status`, `description`, `ingredients[]`, `milestones[]`, `measurements[]`, `notes[]`.

`publicExport()` baut ein neues Objekt aus einer Positivliste auf. Es kopiert niemals die private Charge mit anschließendem Ausblenden:

- Stammdaten und Status nur nach ausdrücklicher Gruppenfreigabe.
- Beschreibung sowie Zutaten inklusive Rezeptnotizen nur bei separater Gruppenfreigabe.
- Meilensteine: ausschließlich `title` und `at` bestätigter Schritte, separat freigegeben. Keine übersprungenen oder offenen Schritte.
- Messungen und Zugaben: nur einzeln freigegebene, nicht zurückgenommene Ereignisse; ausschließlich `kind`, `label`, `value`, `unit`, `method`, `at`. Ergänzungstexte werden nicht exportiert.
- Notizen/Verkostungen: ausschließlich `kind`, `text`, `at`, wenn ausdrücklich freigegeben.
- Keine privaten IDs, Auditdaten, Checklisten, Timerzustände oder vollständigen Rezept-Snapshots.

Die Datei `data/public/demo.json` ist ein gültiges, vollständig unabhängiges öffentliches Beispiel. Ihr Inhalt ist synthetisch. Öffentliche Dateien sind Schnappschüsse; sie enthalten nur den Zeitpunkt der Erstellung, keine Verbindung zur lokalen Charge.
