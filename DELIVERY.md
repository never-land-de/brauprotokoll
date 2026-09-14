# Übergabestatus

Stand: 14. September 2026.

Der klickbare Prototyp ist vollständig lokal implementiert. Rezepteditor, 24-Schritte-Braumodus, persistente Timer, Wasser- und Zutatenbuchungen, Korrekturen, Gärmessungen, Abfüllung, Reifung, mehrere Verkostungen, validierter Sicherungsimport und öffentliche Freigabevorschau sind vorhanden. Bootstrap und IBM Plex werden lokal ausgeliefert.

Lokaler Einstieg: `python3 tests/serve.py`, danach http://127.0.0.1:4173/brauprotokoll/.

Elf automatisierte Logiktests prüfen Mengen, Snapshots, Zustandsregeln, Timer, private Exporte und Importfehler. Browserprüfungen in Chrome bei 375 × 812 px und 1440 × 1000 px umfassen den vollständigen Demoablauf, Persistenz, Wasser, Doppeltipp, Korrekturen, Downloads, Import, öffentliche Demo und Offline-Wiederaufruf. Zusätzliche Tests simulieren Schreibfehler und konkurrierende Tabs. Keine physische iPhone-Prüfung.

Die Veröffentlichung erfolgt über `.github/workflows/pages.yml`. Das Repository war bei Auftragsbeginn privat; GitHub Pages war deaktiviert, und die erwartete Adresse lieferte HTTP 404. Der Workflow versucht, Pages zu aktivieren, sofern Tarif und Rechte dies erlauben. Ein erfolgreicher Quellcode-Upload allein ist noch kein Pages-Deployment. Der endgültige Live-Status wird in der Übergabenachricht mitgeteilt.

Falls die Pages-Aktivierung scheitert: im Repository unter **Settings → Pages** die Quelle **GitHub Actions** wählen und unter **Actions → Test and deploy Brew Control → Run workflow** erneut starten. Falls Pages für das private Repository nicht angeboten wird, benötigt es einen passenden GitHub-Tarif oder eine vom Eigentümer bewusst vorgenommene Änderung der Sichtbarkeit.

Dauerhafte Grenzen: lokale Daten ohne Cloud-Synchronisierung, regelmäßige JSON-Sicherungen erforderlich; keine garantierten iPhone-Hintergrundalarme. Die Rezeptvorlage und die öffentliche Beispielcharge sind ausdrücklich Demo. Keine Berechnung von Abfüllreife, Alkohol, Karbonisierung oder Bitterkeit.
