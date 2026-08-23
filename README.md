# MusicStation

MusicStation is a local-first music library and player built as an installable PWA. The current application combines a Next.js shell with an existing client-side JavaScript application, storing releases, artwork, audio and playlists locally on the device.

## Live

https://music-station-omega.vercel.app/

## Features

- Add releases with cover art and audio files
- Browse a device-local library and open release details
- Create and manage playlists
- Install the app in supported browsers
- Cache the application shell for offline use

## Architecture

`app/page.tsx` provides the Next.js entry point and loads the client-side application from `public/src/main.js`. The existing JavaScript code is responsible for the music-library interface and browser APIs; the Next.js layer provides the application shell, metadata and routes.

## Local-First Storage

MusicStation uses IndexedDB for device-local releases, cover images and audio files. It has no server-side database, upload service or cloud media storage. In a normal browser tab, added releases are temporary and are cleared after a reload; installed PWA use persists them on that device.

## PWA

The web manifest and service worker allow supported browsers to install MusicStation. The service worker caches the application shell for offline use. Device-local music data remains separate in IndexedDB.

## Limitations

Music is stored only in the current browser or installed app. It is not synchronized between devices and is not backed up remotely.

## Tech Stack

- Next.js and React application shell
- Client-side JavaScript application
- IndexedDB and browser audio APIs
- Web App Manifest and Service Worker
- TypeScript for the Next.js shell

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```
