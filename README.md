# MusicStation

MusicStation die Website die ich Gemacht habe um meine eigene Lokale App darzustellen. Ich habe für mich eine App gemacht die ich Gemacht habe um einerseits mit Apps zu experimentieren und anderseits meinen personalisierten Player zu haben.
<video controls src="https://raw.githubusercontent.com/im24a-schlegeld/MusicStation/main/Screen_Recording_20260822_154442_Ken%20Carson%20Archive.mp4"></video>

[Video direkt öffnen](https://github.com/im24a-schlegeld/MusicStation/blob/main/Screen_Recording_20260822_154442_Ken%20Carson%20Archive.mp4)

## Features

- Add releases with cover art and audio files
- Browse a local music library and open release details
- Create and manage playlists
- Install the app as a PWA
- Offline app shell through a service worker

## Storage

In an installed PWA, releases, covers and audio files are stored locally in IndexedDB on that device. The app does not require a database, upload service or environment variables. In a normal browser tab, added releases are temporary and are cleared after a reload.

## PWA

The web manifest and service worker allow supported browsers to install MusicStation. The service worker caches the app shell for offline use; locally added music remains separate from that cache in IndexedDB.

## Tech Stack

- Next.js
- React
- TypeScript
- IndexedDB
- Web App Manifest and Service Worker

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
