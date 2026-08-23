# MusicStation

MusicStation is an installable music archive for storing releases, cover art and audio on a device. It provides a library view, playlists and an add flow without requiring a server or cloud storage.

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
