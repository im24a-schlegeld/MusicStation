# Archive – Vercel edition

Installable music archive PWA prepared for Vercel.

## Storage behavior

- In a normal browser tab, added releases are temporary and disappear after a reload.
- In the installed home-screen PWA, releases, covers, and audio files are stored locally on that device with IndexedDB.
- No database, cloud media storage, upload code, or environment variables are required.

## Local checks

```bash
npm install
npm run build
```
