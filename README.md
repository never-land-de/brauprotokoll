# NOR APA – BREW CONTROL

Ein eigenständiges, mobiles Brauwerkzeug für NOR APA aus Norf und Derikum. Vollständig statisch: HTML, CSS, JavaScript, lokal eingebundenes Bootstrap 5.3.8, IBM Plex Sans/Mono und eigene SVG-Symbole. Keine Konten, Tokens, externen Laufzeitdienste oder Backend-Anforderungen.

## Lokal öffnen

Im Projektordner starten:

```sh
python3 tests/serve.py
```

Dann **http://127.0.0.1:4173/brauprotokoll/** öffnen. Der Server bildet ausdrücklich den GitHub-Pages-Unterpfad ab. Nicht per Doppelklick als `file://` öffnen: ES-Module und Service Worker benötigen HTTP beziehungsweise HTTPS. Zum Beenden im Terminal `Ctrl+C` drücken.

## Die ersten fünf Klicks

1. **Demo ausprobieren** auf der Startseite.
2. **Demo-Schnelllauf** einschalten: neu gestartete Demo-Timer dauern drei Sekunden.
3. **Vorbereitung abschließen**.
4. **Hauptguss erfassen**: 16,5 l prüfen und speichern.
5. **Nachguss erfassen**: zunächst 4,0 l; danach testweise 2,5 l und 3,5 l ergänzen.

Das Wasserfeld zeigt dann 10,0 l Nachguss, 4,0 l laut Plan offen und 26,5 l Brauwasser insgesamt. Anschließend den hervorgehobenen Hauptaktionen folgen. Rasttimer starten erst nach Temperaturbestätigung. Zurückliegende Einträge lassen sich unter **Ablauf & Chronik** korrigieren und zurücknehmen.

Ein eigener Sud entsteht über **Neuen Sud anlegen**. Unter **Vorbereitung** sind Stammdaten, Zutaten, Wasser, Zielwerte, Temperaturen, Dauer und Anweisungen editierbar. Jede Charge hat einen eigenen Rezept-Snapshot. **Neuer Sud mit diesem Rezept** übernimmt nur das Rezept. Rezeptdatei: [`data/templates/altbier.json`](data/templates/altbier.json).

## Ablauf

24 bestätigbare Schritte führen von Vorbereitung, Maischen und Läutern über Kochen, optionalen Whirlpool und Anstellen bis Gärung, Abfüllung, Reifung und Genussbereitschaft. Aufheizen und Haltezeiten sind getrennt. Bittergabe und Kochstart haben denselben dokumentierten Zeitbezug (Minute 0). Die Whirlpool-Ruhe setzt bestätigte Temperatur und Zugabe voraus. Ein abgelaufener Timer bestätigt niemals selbst eine Handlung.

Die Mengen aus den Rezeptnotizen von 2025 sind übernommen: 5,432 kg Schüttung, 16,5 l Hauptguss und 14 l geplanter Nachguss. Weitere Ablaufwerte, zweite Rast, Carafa-Zeitpunkt und Hefeauswahl sind **Demo-Annahmen – vor echtem Brauen prüfen**. Eigene Chargen beginnen ohne Messwerte. Die öffentliche Beispielcharge ist durchgängig als synthetische Demo markiert.

Messwerte unterscheiden Maische, Würze/Bier und Raumtemperatur. Extrakt verlangt eine Einheit (°P, °Brix oder SG) und eine Messmethode. Pfannevollmenge, Menge im Gärbehälter und Abfüllmenge sind eigene Messarten. Kein Alkohol-, Bitterkeits-, Karbonisierungs- oder Abfüllreiferechner.

## Speicherung, Timer und Offlinebetrieb

- IndexedDB `nor-apa-brew-control`, Version 1, Object Store `batches`. „Lokal gespeichert“ erscheint erst nach abgeschlossener Schreibtransaktion.
- Eingaben werden unmittelbar gespeichert, Schreiboperationen nacheinander abgearbeitet. Bei Fehlern bleibt ein sichtbarer Fehlerhinweis. Offene Daten können über das Chargenbuch gesichert und das Speichern erneut versucht werden.
- Mengen werden aus nicht zurückgenommenen Ereignissen summiert. Doppelklickschutz und eindeutige Ereignis-IDs verhindern doppelte Buchungen. Korrekturen bewahren den ursprünglichen Eintrag in der privaten Chronik.
- Timer speichern Startzeitpunkt und Dauer. Hintergrundbetrieb, Navigation und Reload werden dadurch berücksichtigt. Änderungen der Geräteuhr verändern auch die verbleibende Zeit.
- Kein garantierter Alarm bei gesperrtem iPhone; Tonbenachrichtigungen sind nicht implementiert. Die App muss für die Anzeige fälliger Handlungen geöffnet werden.
- Demo-Schnelllauf wirkt nur auf neu gestartete Timer von Demo-Chargen; die Rezeptdauer bleibt erhalten.
- Nach dem ersten erfolgreichen Laden und der Service-Worker-Installation funktionieren App, Vorlage und öffentliche Demo offline. Andere öffentliche Dateien werden nach erfolgreichem Aufruf zwischengespeichert. Vor dem Brautag einmal offline testen.
- Scope des Workers: `/brauprotokoll/`. Hash-Links (`#/batch/...`, `#/public/demo`) benötigen keine serverseitige Routingkonfiguration.
- Updates warten auf das Schließen der alten App-Instanzen. Kein `skipWaiting`, kein automatischer Reload. Bei Releases die Cache-Version in `sw.js` erhöhen.
- Daten sind **keine Cloud-Sicherung** und werden nicht zwischen Geräten, Browsern oder Domains synchronisiert. Safari kann Website-Speicher entfernen. Privates Browsen ist keine dauerhafte Ablage. Regelmäßig exportieren.
- Möglichst nur einen Tab zum Bearbeiten verwenden. Eine konkurrierende Änderung in einem anderen Tab wird beim Speichern erkannt und verhindert unbemerktes Überschreiben. In diesem Fall offene Daten sichern, dann neu laden.

## Sichern und wiederherstellen

Im **Chargenbuch → Vollständige Sicherung** eine JSON-Datei herunterladen. Diese enthält die gesamte aktuelle Charge, Rezept-Snapshot, Timer, private Notizen und Chronik. Jede wichtige Charge separat sichern und die Datei an einem verlässlichen Ort aufbewahren.

Auf der Startseite **Sicherung importieren** wählen. Es werden JSON-Format, Schema-Version, Mengen, Zeiten und Struktur validiert. Maximal 10 MB pro Datei. Beschädigte oder inkompatible Dateien erhalten eine verständliche Fehlermeldung. Eine identische Chargen-ID führt zu einer **Importkopie** mit neuer ID; das Original bleibt erhalten. Öffentliche Dateien sind keine vollständigen Sicherungen und werden hier nicht akzeptiert.

## Einen öffentlichen Stand veröffentlichen

Private Notizen sind standardmäßig privat. Bei jedem Eintrag gibt es eine ausdrückliche Freigabe. Ergänzungstexte zu Messungen und Zugaben bleiben immer privat. Im Chargenbuch:

1. **Öffentliche Vorschau & Export** öffnen. Stammdaten ausdrücklich freigeben; Beschreibung, Zutaten samt Zutatenhinweisen und bestätigte Meilensteine bei Bedarf auswählen. Individuell freigegebene Messungen, Notizen und Verkostungen werden übernommen.
2. Vorschau prüfen, **Öffentlichen Stand exportieren** wählen. Das ist nur ein Dateidownload, kein Upload.
3. Datei im Repository unter `data/public/` ergänzen, beispielsweise `altbier-2026-01.json`. Dateinamen dürfen Buchstaben, Ziffern, Bindestrich und Unterstrich enthalten. **Keine private Sicherung dort ablegen.**
4. Commit und Push nach `main`. Nach erfolgreichem GitHub-Actions-Deployment öffnet `https://never-land-de.github.io/brauprotokoll/#/public/altbier-2026-01` genau diese Datei.

Die mitgelieferte Beispielansicht ist `#/public/demo` und liest ausschließlich [`data/public/demo.json`](data/public/demo.json). Sie funktioniert ohne lokale private Charge. Ein öffentlicher Stand zeigt seinen Exportzeitpunkt und ist keine Live-Synchronisierung.

WordPress kann später diesen Link verwenden oder ein iframe einbetten, zum Beispiel:

```html
<iframe src="https://never-land-de.github.io/brauprotokoll/#/public/demo"
        title="NOR APA – öffentliche Democharge"
        style="width:100%;height:1000px;border:0" loading="lazy"></iframe>
```

Die eingebettete Ansicht bleibt eine externe, reine Leseansicht. Es gibt kein WordPress-Plugin oder Benutzerkonto.

## Tests

Node.js 22+ installieren, dann:

```sh
npm ci
npm test
npm run test:browser
```

Die lokale Browserkonfiguration nutzt Google Chrome am üblichen macOS-Pfad. Alternativ Chromium installieren und seinen Pfad übergeben:

```sh
npx playwright install chromium
CHROME_PATH="/pfad/zu/chromium" npm run test:browser
```

In GitHub Actions werden Chromium und Systemabhängigkeiten automatisch installiert. Tests laufen mit 375 × 812 px und 1440 × 1000 px. Sie prüfen den vollständigen Sud bis Genussbereitschaft, Wasserbuchungen und Rücknahmen, Doppelbuchungsschutz, Timer nach Reload und Navigation, echte Dateidownloads, Importfehler und Kopienschutz, private Freigaben, Offline-Wiederaufruf und Layoutüberlauf. Das ist Browseremulation, **keine Prüfung auf einem physischen iPhone**. Screenshot-Artefakte liegen nach dem Test unter `test-results/` (nicht versioniert).

## GitHub Pages einrichten

Workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml). Pull Requests führen Tests aus; Pushes auf `main` führen erst Logik- und Browsertests, dann das Pages-Deployment aus. Veröffentlicht werden nur `index.html`, `sw.js`, Manifest, `assets/`, `js/` und `data/`.

1. Den fertigen lokalen Commit auf `origin/main` pushen, beispielsweise über **GitHub Desktop → Push origin**. Keine Zugangsdaten im Projekt speichern.
2. Im Repository **Settings → Pages → Build and deployment → Source → GitHub Actions** auswählen.
3. Falls GitHub bei diesem privaten Repository Pages nicht anbietet, ist ein Tarif mit Pages für private Repositories nötig. Alternativ kann der Eigentümer bewusst die Repository-Sichtbarkeit ändern. Die Umsetzung ändert sie nicht automatisch.
4. Unter **Actions → Test and deploy Brew Control** den Lauf prüfen; bei nachträglicher Pages-Aktivierung über **Run workflow** erneut starten.
5. Erst nach erfolgreichem Deployment `https://never-land-de.github.io/brauprotokoll/` sowie `#/public/demo` aufrufen und CSS, Fonts, Rezept-JSON und Offline-Wiederaufruf prüfen.

Eine erwartete Projektadresse allein ist kein Nachweis eines Deployments. Der tatsächliche Übergabestatus steht in [`DELIVERY.md`](DELIVERY.md).

## Dateien und Lizenzen

- `js/core.js`: Berechnung, Zustandsübergänge, Schema-Prüfung, Import und öffentliche Positivliste.
- `js/db.js`: IndexedDB-Transaktionen und Schutz vor konkurrierenden Tab-Änderungen.
- `js/app.js`: Ansichten, Dialoge, Autosave und Navigation.
- `assets/app.css`: NOR-APA-Gestaltung; eigene SVG-Symbole in `app.js` und `assets/icon.svg`.
- [`DATA-SCHEMA.md`](DATA-SCHEMA.md): vollständige Erläuterung der Datenstruktur.
- Bootstrap: MIT, siehe `assets/vendor/BOOTSTRAP-LICENSE`.
- IBM Plex: SIL Open Font License, siehe `assets/fonts/OFL.txt`. Beide Fonts sind als lokale WOFF2-Dateien vorhanden; Fallbacks sind Arial beziehungsweise monospace.
