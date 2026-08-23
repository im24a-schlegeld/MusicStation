# MusicStation

MusicStation ist mein eigener Musikplayer für lokal gespeicherte Musik.

Ich habe das Projekt gemacht, weil ich ausprobieren wollte, wie eine eigene Anwendung zum Verwalten und Abspielen von Musik aufgebaut werden kann.

Releases, Cover und Audiodateien werden lokal auf dem jeweiligen Gerät gespeichert und nicht in eine zentrale Musikdatenbank hochgeladen.

<p align="center">
  <img src="docs/images/musicstation-local-app.jpg" alt="MusicStation – lokale Musikbibliothek" width="420">
</p>

In der Musikbibliothek können Releases durchsucht und nach Release-Typ oder Jahr gefiltert werden. Die Reihenfolge kann ebenfalls geändert werden.

<p align="center">
  <img src="docs/images/musicstation-widget.jpg" alt="MusicStation – kompakter Player" width="780">
</p>

Das Player-Widget zeigt Cover, Songtitel und Interpret. Es enthält Play/Pause, vorherigen und nächsten Titel sowie Shuffle und Repeat.

## Speicherung

MusicStation verwendet IndexedDB für die lokale Speicherung von Releases, Covern und Audiodateien.

Es gibt keine zentrale Musikdatenbank und keine Synchronisation zwischen verschiedenen Geräten.

Die hinzugefügte Musik bleibt auf dem jeweiligen Gerät beziehungsweise im verwendeten Browser oder in der installierten Anwendung.

## Technik

- Next.js
- React
- JavaScript
- TypeScript
- IndexedDB
- Browser Audio APIs
- Web App Manifest
- Service Worker

## Lokal starten

```bash
npm install
npm run dev
```

Projekt prüfen:

```bash
npm run lint
npm run build
```
