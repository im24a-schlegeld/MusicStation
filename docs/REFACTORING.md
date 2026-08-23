# Refactoring Plan

MusicStation currently combines a small Next.js shell with a large client-side JavaScript application. The current structure is kept intact for stability; these are incremental follow-up steps rather than a rewrite plan for the current release.

1. Separate player and playback state from DOM rendering code.
2. Move IndexedDB reads and writes behind a small data-layer module.
3. Extract playlist operations into a dedicated service.
4. Split library, release-detail and playlist UI into focused components.
5. Isolate service-worker registration and PWA update handling.
6. Consolidate the layered CSS patches after visual regression checks.

Each step should retain the local-first storage model and be covered by manual browser checks before replacing the current implementation.
