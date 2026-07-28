# Archive – Vercel edition

Installable music archive PWA prepared for Vercel.

## Required Vercel services

1. Create or connect a Neon Postgres database and expose `DATABASE_URL`.
2. Create a public Vercel Blob store and expose `BLOB_READ_WRITE_TOKEN`.
3. Add a secret `UPLOAD_CODE`.

The database table is created automatically on the first API request.
Audio and cover files upload directly from the browser to Vercel Blob, including multipart uploads for large audio files.

## Local checks

```bash
npm install
npm run build
```

Local uploads require the environment variables from `.env.example`.
