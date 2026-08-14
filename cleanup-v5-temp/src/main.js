// Generic local-music edition: start with no bundled catalog.
const albums = [];
const uploadedReleases = [];

const app = document.querySelector("#app");
const launchScreen = document.querySelector("#launch-screen");
const startupLogoSrc = "/assets/brand-logo.png";

const playerRoot = document.createElement("aside");
playerRoot.className = "player-root";
document.body.append(playerRoot);

const icons = {
  play: "▶",
  pause: "Ⅱ",
  previous: "‹",
  next: "›",
  repeat: "↻",
  shuffle: "⤨",
  up: "↑",
  down: "↓",
  remove: "×"
};

Object.assign(icons, {
  play: "\u25b6",
  pause: "\u23f8",
  previous: "\u23ee",
  next: "\u23ed",
  repeat: "\u21bb",
  shuffle: "\u21c4",
  up: "\u2191",
  down: "\u2193",
  remove: "\u00d7"
});

const svgIcon = (content, viewBox = "0 0 24 24") => `
  <svg viewBox="${viewBox}" aria-hidden="true" focusable="false">
    ${content}
  </svg>
`;

Object.assign(icons, {
  play: svgIcon(`<path d="M8 5v14l11-7z" fill="currentColor" />`),
  pause: svgIcon(`<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />`),
  previous: svgIcon(`<path d="M7 5h2v14H7zM10 12l9 7V5z" fill="currentColor" />`),
  next: svgIcon(`<path d="M15 5h2v14h-2zM5 5v14l9-7z" fill="currentColor" />`),
  repeat: svgIcon(`<path d="M7 7h9l-2-2 1.4-1.4L20 8l-4.6 4.4L14 11l2-2H7a3 3 0 0 0 0 6h1v2H7A5 5 0 0 1 7 7zm10 10H8l2 2-1.4 1.4L4 16l4.6-4.4L10 13l-2 2h9a3 3 0 0 0 0-6h-1V7h1a5 5 0 0 1 0 10z" fill="currentColor" />`),
  shuffle: svgIcon(`<path d="M4 7h3.4c1.2 0 2.1.5 2.9 1.5l.7.9-1.3 1.6-.9-1.1A1.8 1.8 0 0 0 7.4 9H4V7zm12 0h4v4h-2V9h-2a1.8 1.8 0 0 0-1.4.7L9.4 16.5A3.8 3.8 0 0 1 6.4 18H4v-2h2.4c.6 0 1.1-.3 1.5-.7l5.2-6.8A3.8 3.8 0 0 1 16 7zm-3.8 7 1.3-1.6 1.1 1.4c.4.5.8.7 1.4.7h2v-2h2v4h-4a3.8 3.8 0 0 1-2.9-1.5l-.9-1z" fill="currentColor" />`),
  up: svgIcon(`<path d="M12 5l7 7-1.4 1.4L13 8.8V20h-2V8.8l-4.6 4.6L5 12z" fill="currentColor" />`),
  down: svgIcon(`<path d="M11 4h2v11.2l4.6-4.6L19 12l-7 7-7-7 1.4-1.4 4.6 4.6z" fill="currentColor" />`),
  remove: svgIcon(`<path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" fill="currentColor" />`),
  favorite: svgIcon(`<path d="M12 19.5 10.8 18C6.4 14 4 11.8 4 8.8A4 4 0 0 1 8.1 4.7c1.4 0 2.8.7 3.9 1.8a5.2 5.2 0 0 1 3.9-1.8A4 4 0 0 1 20 8.8c0 3-2.4 5.2-6.8 9.2z" fill="none" stroke="currentColor" stroke-width="1.8" />`),
  favoriteFilled: svgIcon(`<path d="M12 20 10.8 18.9C6.4 14.9 4 12.6 4 9A4.2 4.2 0 0 1 8.2 4.8c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8A4.2 4.2 0 0 1 20 9c0 3.6-2.4 5.9-6.8 9.9z" fill="currentColor" />`),
  plusCircle: svgIcon(`<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />`),
  search: svgIcon(`<circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="m15 15 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />`),
  video: svgIcon(`<path d="M5 7h10a2 2 0 0 1 2 2v1.3l3-2V16l-3-2v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm0 2v6h10V9z" fill="currentColor" />`)
});

if (window.Capacitor?.isNativePlatform?.()) {
  document.documentElement.classList.add("native-app");
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function waitForImageElement(image) {
  if (!image) return Promise.resolve();
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  if (typeof image.decode === "function") {
    return image.decode().catch(() => undefined);
  }

  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

function waitForImageSource(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return waitForImageElement(image);
}

function startupImageElements() {
  return [
    ...document.querySelectorAll(
      "#launch-screen img, .library-header img, .album-card img, .album-hero img, .hero-cover, .player-cover"
    )
  ].slice(0, 12);
}

async function waitForStartupReadiness(dataReady) {
  await nextPaint();

  const fontReady =
    document.fonts && typeof document.fonts.ready?.then === "function"
      ? document.fonts.ready
      : Promise.resolve();

  const readyTasks = [
    dataReady,
    fontReady,
    waitForImageSource(startupLogoSrc),
    Promise.allSettled(startupImageElements().map(waitForImageElement)),
    nextPaint()
  ];

  await Promise.allSettled(readyTasks);
  await nextPaint();
}

async function finishStartupLoading(dataReady) {
  if (!launchScreen || window.__xArchiveLaunchFinished) {
    document.body.classList.remove("launch-active");
    return;
  }

  window.__xArchiveLaunchFinished = true;

  await Promise.race([waitForStartupReadiness(dataReady), delay(4200)]);
  await delay(200);

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const removalDelay = reduceMotion ? 240 : 620;

  positionLaunchLogoExit();
  launchScreen.classList.add("is-exiting");
  launchScreen.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    launchScreen.remove();
    document.body.classList.remove("launch-active");
  }, removalDelay);
}

function positionLaunchLogoExit() {
  const logo = launchScreen?.querySelector(".app-launch-logo");
  const headerLogo = document.querySelector(".library-header .archive-gif-logo");
  if (!logo || !headerLogo) return;

  const from = logo.getBoundingClientRect();
  const to = headerLogo.getBoundingClientRect();
  if (!from.width || !from.height || !to.width || !to.height) return;

  const fromCenterX = from.left + from.width / 2;
  const fromCenterY = from.top + from.height / 2;
  const toCenterX = to.left + to.width / 2;
  const toCenterY = to.top + to.height / 2;
  const scale = Math.max(0.05, Math.min(4, to.width / from.width));

  launchScreen.style.setProperty("--launch-target-x", `${toCenterX - fromCenterX}px`);
  launchScreen.style.setProperty("--launch-target-y", `${toCenterY - fromCenterY}px`);
  launchScreen.style.setProperty("--launch-target-scale", String(scale));
}

const favoriteStorageKey = "x-archive-favorites";
const playlistStorageKey = "x-archive-playlists";
const activePlaylistStorageKey = "x-archive-active-playlist";
const sortModeStorageKey = "x-archive-sort-mode";
const yearFilterStorageKey = "x-archive-year-filters";
const playbackStorageKey = "x-archive-playback-state";

function loadFavoriteKeys() {
  try {
    const keys = JSON.parse(localStorage.getItem(favoriteStorageKey) || "[]");
    return Array.isArray(keys) ? keys.filter(Boolean) : [];
  } catch {
    return [];
  }
}

const favoriteKeys = new Set(loadFavoriteKeys());

function saveFavoriteKeys() {
  localStorage.setItem(favoriteStorageKey, JSON.stringify([...favoriteKeys]));
}

function loadSortMode() {
  const saved = localStorage.getItem(sortModeStorageKey);
  return ["newest", "oldest", "added", "title"].includes(saved) ? saved : "newest";
}

function loadYearFilters() {
  try {
    const years = JSON.parse(localStorage.getItem(yearFilterStorageKey) || "[]");
    return Array.isArray(years) ? years.map(String).filter((year) => /^\d{4}$/.test(year)) : [];
  } catch {
    return [];
  }
}

function loadPlaylists() {
  try {
    const playlists = JSON.parse(localStorage.getItem(playlistStorageKey) || "[]");
    if (!Array.isArray(playlists)) return [];

    return playlists
      .map((playlist) => ({
        id: String(playlist.id || `playlist-${Date.now()}`),
        title: String(playlist.title || "Playlist"),
        trackKeys: Array.isArray(playlist.trackKeys) ? playlist.trackKeys.filter(Boolean).map(String) : [],
        createdAt: Number(playlist.createdAt) || Date.now(),
        updatedAt: Number(playlist.updatedAt) || Number(playlist.createdAt) || Date.now()
      }))
      .filter((playlist) => playlist.id);
  } catch {
    return [];
  }
}

let playlists = loadPlaylists();
let activePlaylistId = localStorage.getItem(activePlaylistStorageKey) || playlists[0]?.id || "";

function savePlaylists() {
  localStorage.setItem(playlistStorageKey, JSON.stringify(playlists));
  if (activePlaylistId) localStorage.setItem(activePlaylistStorageKey, activePlaylistId);
  else localStorage.removeItem(activePlaylistStorageKey);
}

const defaultCover = "/assets/brand-logo.png";
const musicVideos = [];


const state = {
  filter: "all",
  query: "",
  includeUnreleasedInAllPlayback: false,
  sortMode: loadSortMode(),
  yearFilters: loadYearFilters(),
  menuOpen: false,
  playlistPickerTrackKey: "",
  playlistPageMode: playlists.length ? "playlist" : "favorites"
};

const playback = {
  audio: new Audio(),
  current: null,
  queue: [],
  repeatQueue: [],
  repeatMode: "queue",
  history: [],
  isPlaying: false,
  ignorePause: false,
  duration: 0,
  time: 0,
  pendingSeekTime: null,
  volume: 1,
  queueOpen: false
};

const seekGesture = {
  active: false,
  pointerId: null,
  wasPlaying: false,
  targetTime: 0,
  slider: null,
  pausePromise: Promise.resolve()
};

let databaseReleases = Array.isArray(uploadedReleases) ? uploadedReleases : [];
const trackLookup = new Map();
let countdownTimer = null;
let renderedRouteKey = "";

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

playback.audio.preload = "metadata";
playback.audio.volume = playback.volume;

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const pluralTracks = (count) => `${count} ${count === 1 ? "track" : "tracks"}`;
const normalizeText = (value) => String(value || "").toLowerCase();

function videoSlug(video) {
  return slugify(video?.title || video?.youtubeId || "video");
}

function videoUrl(video) {
  return `#/videos/${encodeURIComponent(videoSlug(video))}`;
}

function compactVideoKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/!/g, "i")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

function cleanVideoCandidate(value) {
  return String(value || "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(?:official|music|video|visualizer|audio)\b/gi, " ")
    .replace(/\b(?:lyrical lemonade)\b/gi, " ")
    .replace(/\b(?:ft|feat|featuring|with)\.?\b.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function videoMatchKeys(value) {
  const source = String(value || "").replace(/[\u2010-\u2015]/g, "-");
  const candidates = [source, ...source.split(/\s+-\s+/)];
  const keys = new Set();

  candidates.forEach((candidate) => {
    const key = compactVideoKey(cleanVideoCandidate(candidate));
    if (key) keys.add(key);
  });

  return [...keys];
}

const musicVideoLookup = new Map();
musicVideos.forEach((video) => {
  videoMatchKeys(video.title).forEach((key) => {
    if (!musicVideoLookup.has(key)) musicVideoLookup.set(key, video);
  });
});

function musicVideoForTrack(track) {
  for (const key of videoMatchKeys(track?.title)) {
    const video = musicVideoLookup.get(key);
    if (video) return video;
  }
  return null;
}

const releaseKindLabel = (kind) => {
  const normalized = normalizeText(kind);
  if (normalized === "album") return "Album";
  if (normalized === "ep") return "EP";
  if (normalized === "single") return "Single";
  if (normalized === "unreleased") return "Unreleased";
  return kind || "Release";
};
const showReleaseTrackCount = (album) => {
  const normalized = normalizeText(album.kind);
  return !["single", "unreleased"].includes(normalized) && album.tracks.length > 1;
};
const showReleasePlaybackActions = (album) => {
  const normalized = normalizeText(album.kind);
  return !["single", "unreleased"].includes(normalized);
};
const cssImageUrl = (value) => {
  const url = String(value || defaultCover)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "")
    .replaceAll("\r", "");
  return `url("${url}")`;
};

const isCssColor = (value) => {
  const color = String(value || "").trim();
  if (!color) return false;
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return true;
  if (/^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i.test(color)) return true;
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("color", color);
};

const dominantBackgroundColorCache = new Map();
let releaseBackgroundColorRequestId = 0;

const rgbToHex = (red, green, blue) =>
  `#${[red, green, blue]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;

function dominantImageColor(src) {
  if (dominantBackgroundColorCache.has(src)) return Promise.resolve(dominantBackgroundColorCache.get(src));

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      try {
        const sourceWidth = image.naturalWidth || image.width || 1;
        const sourceHeight = image.naturalHeight || image.height || 1;
        const scale = Math.min(1, 140 / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) throw new Error("Canvas unavailable");

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);

        const data = context.getImageData(0, 0, width, height).data;
        const buckets = new Map();

        for (let index = 0; index < data.length; index += 4) {
          if (data[index + 3] < 16) continue;

          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const key = `${red >> 4},${green >> 4},${blue >> 4}`;
          const bucket = buckets.get(key) || { count: 0, red: 0, green: 0, blue: 0 };

          bucket.count += 1;
          bucket.red += red;
          bucket.green += green;
          bucket.blue += blue;
          buckets.set(key, bucket);
        }

        const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
        const color = dominant
          ? rgbToHex(dominant.red / dominant.count, dominant.green / dominant.count, dominant.blue / dominant.count)
          : "#050505";

        dominantBackgroundColorCache.set(src, color);
        resolve(color);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = reject;
    image.src = src;
  });
}

function applyDominantReleaseBackgroundFill(background) {
  const requestId = ++releaseBackgroundColorRequestId;
  document.body.style.setProperty("--release-bg-fill", "#050505");

  dominantImageColor(background)
    .then((color) => {
      if (requestId !== releaseBackgroundColorRequestId) return;
      if (!document.body.classList.contains("has-custom-background")) return;
      document.body.style.setProperty("--release-bg-fill", color);
    })
    .catch(() => {
      if (requestId === releaseBackgroundColorRequestId) {
        document.body.style.setProperty("--release-bg-fill", "#050505");
      }
    });
}

function parsedReleaseDate(album) {
  const raw = String(album.releaseDate || album.releaseYear || "").trim();
  const exactMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (exactMatch) {
    const [, year, month, day] = exactMatch.map(Number);
    return {
      timestamp: new Date(year, month - 1, day).getTime(),
      precision: "exact",
      year,
      month,
      day
    };
  }

  const year = Number.parseInt(raw || album.releaseYear || "0", 10);
  if (Number.isFinite(year) && year > 0) {
    return {
      timestamp: new Date(year, 6, 1).getTime(),
      precision: "year",
      year,
      month: null,
      day: null
    };
  }

  return { timestamp: 0, precision: "unknown", year: 0, month: null, day: null };
}

const releaseDateValue = (album) => {
  const parsed = parsedReleaseDate(album);
  return Number.isFinite(parsed.timestamp) ? parsed.timestamp : 0;
};
const allAlbums = () => [...albums, ...databaseReleases];
const getAlbum = (id) => allAlbums().find((album) => album.id === id);
const collectionExtraOnlyReleaseBases = {
  xtended: "x",
  "a-great-chaos-deluxe": "a-great-chaos"
};

function releaseAddedValue(album) {
  const explicit = Date.parse(album.addedAt || album.createdAt || album.updatedAt || "");
  if (Number.isFinite(explicit)) return explicit;

  const idStamp = String(album.id || "").match(/-(\d{10,})$/);
  if (idStamp) return Number(idStamp[1]);

  return releaseDateValue(album);
}

function matchesFilter(album, options = {}) {
  const kind = normalizeText(album.kind);
  if (state.filter !== "all") return kind === state.filter;
  return options.includeUnreleasedInAll || kind !== "unreleased";
}

function albumUrl(album) {
  return `#/album/${album.id}`;
}

function getHashRoute() {
  return window.location.hash.replace(/^#\/?/, "");
}

function currentRouteKey() {
  const route = getHashRoute();
  if (route) return route;
  return window.location.pathname.replace(/^\/+/, "") || "/";
}

/* Remember the scroll position of every app route.
   This keeps list/library/video/playlist positions stable when a detail page is
   opened and the user later returns. It is intentionally independent of the
   player scroll guards below. */
const routeScrollPositions = new Map();
let routeScrollSaveFrame = 0;

function currentPageScrollTop() {
  return Math.max(
    0,
    Number(window.scrollY || window.pageYOffset || 0),
    Number(document.documentElement?.scrollTop || 0),
    Number(document.body?.scrollTop || 0)
  );
}

function saveRouteScrollPosition(routeKey = renderedRouteKey || currentRouteKey()) {
  if (!routeKey) return;
  routeScrollPositions.set(routeKey, currentPageScrollTop());
}

function scheduleRouteScrollPositionSave() {
  if (routeScrollSaveFrame) return;
  routeScrollSaveFrame = requestAnimationFrame(() => {
    routeScrollSaveFrame = 0;
    saveRouteScrollPosition(renderedRouteKey || currentRouteKey());
  });
}

function restoreRouteScrollPosition(routeKey) {
  const savedTop = routeScrollPositions.get(routeKey);
  if (!Number.isFinite(savedTop)) return false;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const maxScroll = Math.max(
        0,
        (document.documentElement?.scrollHeight || document.body?.scrollHeight || 0) - window.innerHeight
      );
      const top = Math.min(Math.max(0, savedTop), maxScroll);

      try {
        window.scrollTo({ top, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, top);
      }

      if (document.documentElement) document.documentElement.scrollTop = top;
      if (document.body) document.body.scrollTop = top;
    });
  });

  return true;
}

function isInternalRouteLink(link) {
  if (!(link instanceof HTMLAnchorElement)) return false;
  if (link.target && link.target !== "_self") return false;

  const href = String(link.getAttribute("href") || "").trim();
  if (!href || href === "#") return false;
  if (href.startsWith("#/")) return true;
  if (href.startsWith("/")) return true;

  try {
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function scrollPageToTop() {
  requestAnimationFrame(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      window.scrollTo(0, 0);
    }

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

function scrollVideoIntoView(videoSlugValue) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = [...app.querySelectorAll("[data-video-slug]")]
        .find((element) => element.dataset.videoSlug === videoSlugValue);

      if (!target) {
        scrollPageToTop();
        return;
      }

      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      target.focus({ preventScroll: true });
    });
  });
}

function isAddRoute() {
  const route = getHashRoute();
  return route === "add" || (!window.location.hash && window.location.pathname === "/add");
}

function isVideosRoute() {
  return false;
}

function getRouteVideoSlug() {
  const route = getHashRoute();
  if (route.startsWith("videos/")) return decodeURIComponent(route.replace(/^videos\//, "").split("/")[0]);

  if (!window.location.hash) {
    const pathMatch = window.location.pathname.match(/^\/videos\/([^/]+)/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  }

  return "";
}

function isPlaylistsRoute() {
  const route = getHashRoute();
  return route === "playlists" || (!window.location.hash && window.location.pathname === "/playlists");
}

function isAlbumRoute() {
  const route = getHashRoute();
  return route.startsWith("album/") || (!window.location.hash && window.location.pathname.startsWith("/album/"));
}

function getRouteAlbum() {
  const route = getHashRoute();
  if (route.startsWith("album/")) return getAlbum(route.replace("album/", ""));

  if (!window.location.hash) {
    const pathMatch = window.location.pathname.match(/^\/album\/([^/]+)/);
    return pathMatch ? getAlbum(pathMatch[1]) : null;
  }

  return null;
}

function filteredAlbums() {
  const query = state.query.trim().toLowerCase();
  const results = allAlbums().filter((album) => {
    const kindMatch = matchesFilter(album, { includeUnreleasedInAll: Boolean(query) });
    return kindMatch && releaseMatchesYear(album) && releaseMatchesQuery(album, query);
  });

  return sortReleases(results);
}

function playbackReleasesForCurrentView() {
  const query = state.query.trim().toLowerCase();

  if (state.filter !== "all") return filteredAlbums();

  const releases = allAlbums().filter((album) => {
    const isUnreleased = normalizeText(album.kind) === "unreleased";
    if (isUnreleased && !state.includeUnreleasedInAllPlayback) return false;
    return releaseMatchesYear(album) && releaseMatchesQuery(album, query);
  });

  return sortReleases(releases);
}

function releaseYearKey(album) {
  const directYear = String(album?.releaseYear || "").match(/\d{4}/);
  if (directYear) return directYear[0];

  const dateYear = String(album?.releaseDate || "").match(/\d{4}/);
  return dateYear ? dateYear[0] : "";
}

function releaseMatchesYear(album) {
  if (!state.yearFilters.length) return true;
  return state.yearFilters.includes(releaseYearKey(album));
}

function availableReleaseYears() {
  return [...new Set(allAlbums().map(releaseYearKey).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
}

function releaseMatchesQuery(album, query) {
  return (
    !query ||
    normalizeText(album.title).includes(query) ||
    normalizeText(album.primaryArtist || album.artist).includes(query) ||
    album.tracks.some(
      (track) =>
        normalizeText(track.title).includes(query) ||
        normalizeText(track.primaryArtist || track.artist).includes(query)
    )
  );
}

function sortReleases(releases) {
  return releases
    .map((album, index) => ({ album, index }))
    .sort((a, b) => {
      if (state.sortMode === "oldest") {
        return releaseDateValue(a.album) - releaseDateValue(b.album) || a.index - b.index;
      }

      if (state.sortMode === "added") {
        return releaseAddedValue(b.album) - releaseAddedValue(a.album) || a.index - b.index;
      }

      if (state.sortMode === "title") {
        return normalizeText(a.album.title).localeCompare(normalizeText(b.album.title)) || a.index - b.index;
      }

      return releaseDateValue(b.album) - releaseDateValue(a.album) || a.index - b.index;
    })
    .map(({ album }) => album);
}

function matchingSongs() {
  const query = state.query.trim().toLowerCase();
  if (!query) return [];

  return allAlbums()
    .flatMap((album) => {
      if (!matchesFilter(album, { includeUnreleasedInAll: true })) return [];
      if (!releaseMatchesYear(album)) return [];

      return album.tracks
        .filter((track) => !track.locked)
        .map((track) => ({ track: playableTrack(album, track), rank: trackMatchRank(album, track, query) }))
        .filter((match) => match.rank !== Infinity);
    })
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        normalizeText(a.track.title).length - normalizeText(b.track.title).length ||
        releaseDateValue(b.track) - releaseDateValue(a.track)
    )
    .map((match) => match.track);
}

function trackMatchRank(album, track, query) {
  const trackTitle = normalizeText(track.title);
  const albumTitle = normalizeText(album.title);
  const trackArtist = normalizeText(track.primaryArtist || track.artist);
  const albumArtist = normalizeText(album.primaryArtist || album.artist);
  if (trackTitle === query) return 0;
  if (trackTitle.startsWith(query)) return 1;
  if (trackTitle.includes(query)) return 2;
  if (albumTitle.startsWith(query)) return 3;
  if (albumTitle.includes(query)) return 4;
  if (trackArtist.startsWith(query) || albumArtist.startsWith(query)) return 5;
  if (trackArtist.includes(query) || albumArtist.includes(query)) return 6;
  return Infinity;
}

function playableTrack(album, track) {
  const expanded = {
    ...track,
    key: `${album.id}:${track.number}`,
    albumId: album.id,
    albumTitle: album.title,
    albumKind: album.kind,
    releaseYear: album.releaseYear,
    releaseDate: album.releaseDate,
    artist: track.artist || album.artist || "",
    primaryArtist: track.primaryArtist || album.primaryArtist || track.artist || album.artist || "",
    cover: album.cover || defaultCover,
    accent: album.accent
  };
  trackLookup.set(expanded.key, expanded);
  return expanded;
}

function trackPrimaryArtist(track) {
  return String(track?.primaryArtist || track?.artist || "").trim();
}

function trackNativeArtist(track) {
  return String(track?.primaryArtist || track?.artist || track?.albumTitle || "Local Music").trim() || "Local Music";
}

function releasePrimaryArtist(album) {
  return String(album?.primaryArtist || album?.artist || "").trim();
}

function trackProjectSubtitle(track) {
  if (!track) return "";

  const artist = trackPrimaryArtist(track);
  if (artist) return artist;

  const isSingle = normalizeText(track.albumKind) === "single";
  const sameTitle = normalizeText(track.title) === normalizeText(track.albumTitle);

  if (isSingle || sameTitle) return "";

  return track.albumTitle;
}

function isFavoriteTrack(track) {
  return Boolean(track?.key && favoriteKeys.has(track.key));
}

function favoriteTracks() {
  allAlbums().forEach((album) => {
    album.tracks
      .filter((track) => !track.locked)
      .forEach((track) => playableTrack(album, track));
  });

  return [...favoriteKeys].map((key) => trackLookup.get(key)).filter(Boolean);
}

function toggleFavoriteTrack(track) {
  if (!track?.key) return;

  if (favoriteKeys.has(track.key)) favoriteKeys.delete(track.key);
  else favoriteKeys.add(track.key);

  saveFavoriteKeys();
  updateFavoriteStates();
  updateNativeMediaNotification(true);
}

function playFavorites(options = {}) {
  const tracks = favoriteTracks();
  if (!tracks.length) return;
  const nextTracks = options.randomize ? shuffleTracks(tracks) : tracks;
  playback.history = [];
  playback.queue = nextTracks.slice(1);
  setRepeatQueue(nextTracks);
  playTrack(nextTracks[0], { preserveRepeatQueue: true, remember: false });
  renderPlayer();
  updateTrackStates();
}

function playFavoriteItem(index) {
  const favorites = favoriteTracks();
  if (!Number.isInteger(index) || index < 0 || index >= favorites.length) return;

  const nextTracks = [...favorites.slice(index), ...favorites.slice(0, index)];
  playback.history = [];
  playback.queue = nextTracks.slice(1);
  setRepeatQueue(nextTracks);
  playTrack(nextTracks[0], { preserveRepeatQueue: true, remember: false });
  renderPlayer();
  updateTrackStates();
}

function ensureTrackLookup() {
  allAlbums().forEach((album) => {
    album.tracks
      .filter((track) => !track.locked)
      .forEach((track) => playableTrack(album, track));
  });
}

function playlistId() {
  return `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getActivePlaylist() {
  if (!playlists.length) {
    activePlaylistId = "";
    return null;
  }

  const playlist = playlists.find((item) => item.id === activePlaylistId) || playlists[0];
  activePlaylistId = playlist.id;
  return playlist;
}

function createPlaylist(title) {
  const cleanTitle = String(title || "").trim() || "New Playlist";
  const now = Date.now();
  const playlist = {
    id: playlistId(),
    title: cleanTitle,
    trackKeys: [],
    createdAt: now,
    updatedAt: now
  };

  playlists = [playlist, ...playlists];
  activePlaylistId = playlist.id;
  state.playlistPageMode = "playlist";
  savePlaylists();
  return playlist;
}

function playlistTracks(playlist) {
  if (!playlist) return [];
  ensureTrackLookup();
  return playlist.trackKeys.map((key) => trackLookup.get(key)).filter(Boolean);
}

function toggleTrackInPlaylist(track, playlistIdValue) {
  if (!track?.key) return;

  const playlist = playlists.find((item) => item.id === playlistIdValue);
  if (!playlist) return;

  const existingIndex = playlist.trackKeys.indexOf(track.key);
  if (existingIndex >= 0) playlist.trackKeys.splice(existingIndex, 1);
  else {
    playlist.trackKeys.push(track.key);
    activePlaylistId = playlist.id;
    state.playlistPageMode = "playlist";
  }

  playlist.updatedAt = Date.now();
  savePlaylists();
  updateTrackStates();
}

function openPlaylistPicker(track) {
  if (!track?.key) return;
  ensureTrackLookup();
  if (!playlists.length) createPlaylist("New Playlist");
  state.playlistPickerTrackKey = track.key;
  renderPlaylistPicker();
}

function closePlaylistPicker() {
  state.playlistPickerTrackKey = "";
  renderPlaylistPicker();
}

function playlistPickerMarkup() {
  if (!state.playlistPickerTrackKey) return "";

  const track = trackLookup.get(state.playlistPickerTrackKey);
  if (!track) return "";

  return `
    <div class="playlist-picker-backdrop" data-close-playlist-picker>
      <section class="playlist-picker" role="dialog" aria-modal="true" aria-label="Choose playlists" data-playlist-picker>
        <div class="playlist-picker-head">
          <span>Add to playlist</span>
          <button class="icon-button" type="button" data-close-playlist-picker aria-label="Close playlist picker" title="Close">
            <span aria-hidden="true">${icons.remove}</span>
          </button>
        </div>
        <div class="playlist-picker-track">
          <img src="${escapeHtml(track.cover || defaultCover)}" alt="${escapeHtml(track.albumTitle || track.title)} cover" loading="lazy" crossorigin="anonymous" />
          <div>
            <strong>${escapeHtml(track.title)}</strong>
            ${trackProjectSubtitle(track) ? `<small>${escapeHtml(trackProjectSubtitle(track))}</small>` : ""}
          </div>
        </div>
        <div class="playlist-picker-list">
          ${playlists
            .map((playlist) => {
              const added = playlist.trackKeys.includes(track.key);
              return `
                <button class="playlist-picker-option${added ? " is-added" : ""}" type="button" data-add-to-playlist="${escapeHtml(playlist.id)}" aria-pressed="${added}">
                  <span>${escapeHtml(playlist.title)}</span>
                  <small>${added ? "Selected" : pluralTracks(playlist.trackKeys.length)}</small>
                </button>
              `;
            })
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderPlaylistPicker() {
  document.querySelectorAll(".playlist-picker-backdrop").forEach((element) => element.remove());
  const markup = playlistPickerMarkup();
  if (markup) document.body.insertAdjacentHTML("beforeend", markup);
}

function removePlaylistTrack(playlistIdValue, index) {
  const playlist = playlists.find((item) => item.id === playlistIdValue);
  if (!playlist || !Number.isInteger(index) || index < 0 || index >= playlist.trackKeys.length) return;
  playlist.trackKeys.splice(index, 1);
  playlist.updatedAt = Date.now();
  savePlaylists();
  render();
  updateTrackStates();
}

function deletePlaylist(playlistIdValue) {
  playlists = playlists.filter((playlist) => playlist.id !== playlistIdValue);
  if (activePlaylistId === playlistIdValue) activePlaylistId = playlists[0]?.id || "";
  if (!playlists.length) state.playlistPageMode = "favorites";
  savePlaylists();
  render();
  updateTrackStates();
}

function playPlaylist(playlistIdValue, options = {}) {
  const playlist = playlists.find((item) => item.id === playlistIdValue);
  const tracks = playlistTracks(playlist);
  if (!tracks.length) return;
  const nextTracks = options.randomize ? shuffleTracks(tracks) : tracks;
  playback.history = [];
  playback.queue = nextTracks.slice(1);
  setRepeatQueue(nextTracks);
  playTrack(nextTracks[0], { preserveRepeatQueue: true, remember: false });
  renderPlayer();
  updateTrackStates();
}

function playPlaylistItem(playlistIdValue, index) {
  const playlist = playlists.find((item) => item.id === playlistIdValue);
  const tracks = playlistTracks(playlist);
  if (!Number.isInteger(index) || index < 0 || index >= tracks.length) return;

  const nextTracks = [...tracks.slice(index), ...tracks.slice(0, index)];
  playback.history = [];
  playback.queue = nextTracks.slice(1);
  setRepeatQueue(nextTracks);
  playTrack(nextTracks[0], { preserveRepeatQueue: true, remember: false });
  renderPlayer();
  updateTrackStates();
}

function absoluteAppUrl(path) {
  if (!path) return window.location.origin + defaultCover;
  return new URL(path, window.location.origin).href;
}

function getArchiveMediaPlugin() {
  return window.Capacitor?.Plugins?.ArchiveMedia || null;
}

async function resolvePersistentVideoSources() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.getMediaPath !== "function") return;

  const videos = [...document.querySelectorAll("video[data-local-video-src]")];
  await Promise.allSettled(
    videos.map(async (video) => {
      const webPath = video.dataset.localVideoSrc;
      if (!webPath) return;
      const result = await archiveMedia.getMediaPath({ path: webPath });
      if (!result?.uri) return;
      const resolved = window.Capacitor?.convertFileSrc
        ? window.Capacitor.convertFileSrc(result.uri)
        : result.uri;
      const source = video.querySelector("source");
      if (source) source.src = resolved;
      else video.src = resolved;
      video.load();
    })
  );
}

let nativeMediaListenerReady = false;
let lastNativeMediaUpdate = 0;

async function updateNativeMediaNotification(force = false) {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia) return;

  const now = Date.now();
  if (!force && now - lastNativeMediaUpdate < 900) return;
  lastNativeMediaUpdate = now;

  const track = playback.current;

  try {
    if (!track) {
      persistPlaybackState();
      return;
    }

    if (typeof archiveMedia.update !== "function") return;

    await archiveMedia.update({
      title: track.title || "Unknown track",
      album: track.albumTitle || "Archive",
      artist: trackNativeArtist(track),
      cover: track.cover || defaultCover,
      isPlaying: Boolean(playback.isPlaying),
      isFavorite: isFavoriteTrack(track),
      duration: Number(playback.duration || 0),
      position: Number(playback.time || playback.audio.currentTime || 0)
    });
  } catch {
    // Native plugin not available or notification permission missing.
  }
}

function isNativePlaybackAvailable() {
  const archiveMedia = getArchiveMediaPlugin();
  return Boolean(archiveMedia && typeof archiveMedia.playQueue === "function");
}

function nativeTrackPayload(track) {
  if (!track) return null;

  return {
    key: track.key || "",
    title: track.title || "Unknown track",
    albumTitle: track.albumTitle || "Archive",
    albumId: track.albumId || "",
    albumKind: track.albumKind || "",
    releaseYear: track.releaseYear || "",
    releaseDate: track.releaseDate || "",
    artist: trackNativeArtist(track),
    primaryArtist: track.primaryArtist || track.artist || "",
    src: track.src || "",
    cover: track.cover || defaultCover,
    accent: track.accent || "",
    endAt: Number(track.endAt || 0)
  };
}

function nativeQueueTracks(current = playback.current, queue = playback.queue) {
  return [...playback.history, current, ...queue].filter(Boolean);
}

function nativeQueuePayload(current, queue) {
  return nativeQueueTracks(current, queue).map(nativeTrackPayload).filter(Boolean);
}

function restoreTrackFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;

  ensureTrackLookup();

  const key = String(payload.key || "");
  if (key && trackLookup.has(key)) return trackLookup.get(key);
  if (!payload.src) return null;

  return {
    key: key || String(payload.src),
    title: payload.title || "Unknown track",
    albumTitle: payload.albumTitle || "Archive",
    albumId: payload.albumId || "",
    albumKind: payload.albumKind || "",
    releaseYear: payload.releaseYear || "",
    releaseDate: payload.releaseDate || "",
    artist: payload.artist || "",
    primaryArtist: payload.primaryArtist || payload.artist || "",
    src: payload.src,
    cover: payload.cover || defaultCover,
    accent: payload.accent || "",
    endAt: Number(payload.endAt || 0)
  };
}

function restoreTracksFromPayload(payloadTracks) {
  if (!Array.isArray(payloadTracks)) return [];
  return payloadTracks.map(restoreTrackFromPayload).filter(Boolean);
}

function normalizeRepeatMode(mode) {
  return mode === "track" ? "track" : "queue";
}

function persistPlaybackState() {
  try {
    const statePayload = {
      current: nativeTrackPayload(playback.current),
      queue: playback.queue.map(nativeTrackPayload).filter(Boolean),
      history: playback.history.map(nativeTrackPayload).filter(Boolean),
      repeatQueue: playback.repeatQueue.map(nativeTrackPayload).filter(Boolean),
      repeatMode: playback.repeatMode,
      volume: playback.volume,
      duration: playback.duration,
      time: playback.time,
      queueOpen: playback.queueOpen,
      savedAt: Date.now()
    };

    localStorage.setItem(playbackStorageKey, JSON.stringify(statePayload));
  } catch {
    // Storage can be unavailable in private or constrained WebViews.
  }
}

function restorePlaybackState() {
  try {
    const saved = JSON.parse(localStorage.getItem(playbackStorageKey) || "null");
    if (!saved || typeof saved !== "object") return false;

    let current = restoreTrackFromPayload(saved.current);
    const queue = restoreTracksFromPayload(saved.queue);
    const history = restoreTracksFromPayload(saved.history);
    const repeatQueue = restoreTracksFromPayload(saved.repeatQueue);

    if (!current && !queue.length && !history.length) return false;
    if (!current && queue.length) current = queue.shift();
    if (!current && history.length) current = history.pop();
    if (!current) return false;

    playback.current = current;
    playback.queue = queue;
    playback.history = history;
    playback.repeatQueue = repeatQueue.length ? repeatQueue : [current, ...queue].filter(Boolean);
    playback.repeatMode = normalizeRepeatMode(saved.repeatMode);
    playback.volume = Math.max(0, Math.min(1, Number(saved.volume ?? 1)));
    playback.audio.volume = playback.volume;
    playback.duration = Math.max(0, Number(saved.duration || 0));
    playback.time = Math.max(0, Number(saved.time || 0));
    playback.queueOpen = Boolean(saved.queueOpen);
    playback.isPlaying = false;
    return true;
  } catch {
    return false;
  }
}

function applyNativeQueueState(state = {}) {
  if (!Array.isArray(state.queue) || !state.queue.length) return false;

  const nativeTracks = restoreTracksFromPayload(state.queue);
  if (!nativeTracks.length) return false;

  const keyedIndex = state.key
    ? nativeTracks.findIndex((track) => track.key === state.key)
    : -1;
  const numericIndex = Number.isInteger(state.currentIndex) ? state.currentIndex : keyedIndex;
  const currentIndex = Math.max(0, Math.min(numericIndex >= 0 ? numericIndex : 0, nativeTracks.length - 1));

  playback.history = nativeTracks.slice(0, currentIndex);
  playback.current = nativeTracks[currentIndex] || null;
  playback.queue = nativeTracks.slice(currentIndex + 1);
  setRepeatQueue(nativeTracks);
  return Boolean(playback.current);
}

async function hydrateNativePlaybackState() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.getState !== "function") return;

  try {
    const nativeState = await archiveMedia.getState();
    if (nativeState) updateUiFromNativeState(nativeState);
  } catch {
    // Native state is best-effort during cold starts.
  }
}

async function consumePendingNativeAction() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.consumePendingAction !== "function") return;

  try {
    const pending = await archiveMedia.consumePendingAction();
    if (pending?.action) handleNativeMediaAction(pending.action, pending);
  } catch {
    // Older native builds do not expose pending actions.
  }
}

let nativeStateTimer = null;

function startNativeStateTimer() {
  if (nativeStateTimer) return;

  nativeStateTimer = window.setInterval(() => {
    if (!isNativePlaybackAvailable() || !playback.current || !playback.isPlaying) return;

    const archiveMedia = getArchiveMediaPlugin();
    if (!archiveMedia || typeof archiveMedia.getState !== "function") return;

    archiveMedia.getState()
      .then((state) => {
        if (!state) return;

        if (typeof state.position === "number") playback.time = state.position;
        if (typeof state.duration === "number" && state.duration > 0) playback.duration = state.duration;
        if (typeof state.isPlaying === "boolean") playback.isPlaying = state.isPlaying;

        syncPlayerTime();
        updateTrackStates();
        persistPlaybackState();
      })
      .catch(() => {});
  }, 1000);
}

function updateUiFromNativeState(state = {}) {
  if (!state) return;

  const previousTrackKey = playback.current?.key || "";
  const previousQueueKeys = playback.queue.map((track) => track.key).join("|");
  const previousRepeatMode = playback.repeatMode;

  applyNativeQueueState(state);

  if (typeof state.position === "number") playback.time = state.position;
  if (typeof state.duration === "number" && state.duration > 0) playback.duration = state.duration;
  if (typeof state.isPlaying === "boolean") playback.isPlaying = state.isPlaying;
  if (typeof state.repeatMode === "string") playback.repeatMode = normalizeRepeatMode(state.repeatMode);

  if (state.key && playback.current?.key !== state.key) {
    const track = trackLookup.get(state.key);
    if (track) {
      const nativeTracks = nativeQueueTracks();
      const nativeIndex = nativeTracks.findIndex((nativeTrack) => nativeTrack.key === state.key);

      if (nativeIndex >= 0) {
        playback.history = nativeTracks.slice(0, nativeIndex);
        playback.current = nativeTracks[nativeIndex];
        playback.queue = nativeTracks.slice(nativeIndex + 1);
      } else {
        if (playback.current && playback.current.key !== track.key) {
          playback.history.push(playback.current);
        }
        playback.current = track;
      }
    }
  }

  const playerStructureChanged =
    previousTrackKey !== (playback.current?.key || "") ||
    previousQueueKeys !== playback.queue.map((track) => track.key).join("|") ||
    previousRepeatMode !== playback.repeatMode;

  if (playerStructureChanged) renderPlayer();
  else {
    syncPlayerPlaybackControls();
    syncPlayerTime();
  }
  updateTrackStates();
  updateMediaSession(true);
  persistPlaybackState();
}

function shownPlaybackPosition() {
  const raw = Number(playback.time || playback.audio.currentTime || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  const duration = Number(playback.duration || 0);
  if (duration > 0) return Math.max(0, Math.min(raw, Math.max(0, duration - 0.05)));

  return raw;
}

function ensureHtmlAudioSourceForCurrentTrack() {
  if (!playback.current?.src) return false;

  const currentSrc = playback.audio.getAttribute("src") || "";
  if (currentSrc !== playback.current.src) {
    playback.audio.src = playback.current.src;
    playback.audio.load();
  }

  return true;
}

function applyPendingHtmlAudioSeek() {
  const position = Number(playback.pendingSeekTime);
  playback.pendingSeekTime = null;

  if (!Number.isFinite(position) || position <= 0) return;

  try {
    playback.audio.currentTime = position;
    playback.time = playback.audio.currentTime || position;
    syncPlayerTime();
    updateMediaSession();
    persistPlaybackState();
  } catch {
    playback.pendingSeekTime = position;
  }
}

function seekHtmlAudioToShownTime() {
  const position = shownPlaybackPosition();
  if (position <= 0) return;

  playback.pendingSeekTime = position;

  if (playback.audio.readyState >= 1) {
    applyPendingHtmlAudioSeek();
    return;
  }

  playback.audio.addEventListener("loadedmetadata", applyPendingHtmlAudioSeek, { once: true });
}

async function nativePlayFromShownTime() {
  if (!playback.current) return false;

  const startPosition = shownPlaybackPosition();
  const started = await nativePlayQueueFromState(0, { startPosition });
  if (started) return true;

  if (startPosition > 0) await nativeSeek(startPosition);
  return nativeResume();
}

async function nativePlayQueueFromState(startIndex = 0, options = {}) {
  if (!isNativePlaybackAvailable() || !playback.current) return false;

  const archiveMedia = getArchiveMediaPlugin();
  const queue = nativeQueuePayload(playback.current, playback.queue);
  const nativeStartIndex = startIndex > 0 ? startIndex : playback.history.length;
  const startPosition = Math.max(0, Number(options.startPosition || 0));

  try {
    await archiveMedia.playQueue({
      queue,
      startIndex: nativeStartIndex,
      startPosition,
      repeatMode: playback.repeatMode,
      volume: playback.volume
    });

    playback.isPlaying = true;
    startNativeStateTimer();
    syncPlayerPlaybackControls();
    updateTrackStates();
    return true;
  } catch {
    return false;
  }
}

async function nativePause() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.pause !== "function") return false;

  const previousState = playback.isPlaying;
  playback.isPlaying = false;
  syncPlayerPlaybackControls();

  try {
    await archiveMedia.pause();
    updateTrackStates();
    return true;
  } catch {
    playback.isPlaying = previousState;
    syncPlayerPlaybackControls();
    return false;
  }
}

async function nativeResume() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.resume !== "function") return false;

  const previousState = playback.isPlaying;
  playback.isPlaying = true;
  syncPlayerPlaybackControls();

  try {
    await archiveMedia.resume();
    startNativeStateTimer();
    updateTrackStates();
    return true;
  } catch {
    playback.isPlaying = previousState;
    syncPlayerPlaybackControls();
    return false;
  }
}

async function nativeNext() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.next !== "function") return false;

  try {
    await archiveMedia.next();
    return true;
  } catch {
    return false;
  }
}

async function nativePrevious() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.previous !== "function") return false;

  try {
    await archiveMedia.previous();
    return true;
  } catch {
    return false;
  }
}

async function nativeSeek(position, resumeAfter = null) {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.seekTo !== "function") return false;

  try {
    const options = { position };
    if (typeof resumeAfter === "boolean") options.resumeAfter = resumeAfter;
    await archiveMedia.seekTo(options);
    return true;
  } catch {
    return false;
  }
}

async function nativeSetVolume(volume) {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.setVolume !== "function") return false;

  try {
    await archiveMedia.setVolume({ volume });
    return true;
  } catch {
    return false;
  }
}

async function nativeSetRepeatMode() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.setRepeatMode !== "function") return false;

  try {
    await archiveMedia.setRepeatMode({ repeatMode: playback.repeatMode });
    return true;
  } catch {
    return false;
  }
}

async function nativeSyncQueueOnly() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.setQueue !== "function" || !playback.current) return false;

  try {
    await archiveMedia.setQueue({
      queue: nativeQueuePayload(playback.current, playback.queue),
      startIndex: playback.history.length,
      repeatMode: playback.repeatMode
    });
    return true;
  } catch {
    return false;
  }
}

let nativeActionLock = false;

function handleNativeMediaAction(action, event = {}) {
  if (!action) return;

  if (action === "state") {
    updateUiFromNativeState(event);
    return;
  }

  if (action === "ended") {
    updateUiFromNativeState(event);
    return;
  }

  if (nativeActionLock) return;
  nativeActionLock = true;
  window.setTimeout(() => {
    nativeActionLock = false;
  }, 350);

  if (action === "playAllRandomUnreleased") {
    playAllWithUnreleasedRandomized();
    return;
  }

  if (action === "play") {
    if (playback.current) void nativePlayFromShownTime();
    else playAllWithUnreleasedRandomized();
    return;
  }

  if (action === "pause") {
    void nativePause();
    return;
  }

  if (action === "toggle") {
    if (!playback.current) {
      playAllWithUnreleasedRandomized();
      return;
    }
    if (playback.isPlaying) void nativePause();
    else void nativePlayFromShownTime();
    return;
  }

  if (action === "next") {
    void nativeNext();
    return;
  }

  if (action === "previous") {
    void nativePrevious();
    return;
  }

  if (action === "shuffle") {
    shuffleCurrentQueue();
    return;
  }

  if (action === "repeat") {
    cycleRepeatMode();
    return;
  }

  if (action === "favorite") {
    if (playback.current) toggleFavoriteTrack(playback.current);
  }
}

function setupNativeMediaBridge() {
  if (nativeMediaListenerReady) return;

  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.addListener !== "function") return;

  nativeMediaListenerReady = true;

  archiveMedia.addListener("mediaAction", (event) => {
    handleNativeMediaAction(event?.action, event || {});
  });
}

function handleInAppBackButton() {
  if (playback.queueOpen) {
    playback.queueOpen = false;
    renderPlayer();
    return true;
  }

  if (isAlbumRoute() || isVideosRoute() || isPlaylistsRoute() || isAddRoute()) {
    saveRouteScrollPosition(renderedRouteKey || currentRouteKey());
    history.pushState({}, "", "/");
    render();
    return true;
  }

  if (window.location.hash && window.location.hash !== "#/" && window.location.hash !== "#") {
    saveRouteScrollPosition(renderedRouteKey || currentRouteKey());
    history.pushState({}, "", "/");
    render();
    return true;
  }

  return true;
}

function setupAndroidBackButton() {
  window.__archiveHandleAndroidBack = handleInAppBackButton;
  window.addEventListener("androidBackButton", handleInAppBackButton);

  const appPlugin = window.Capacitor?.Plugins?.App;
  if (appPlugin && typeof appPlugin.addListener === "function") {
    try {
      appPlugin.addListener("backButton", () => {
        handleInAppBackButton();
      });
    } catch {
      // App plugin not installed.
    }
  }
}

function updateMediaSession(forceNative = false) {
  const track = playback.current;

  if (!track) {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }

    void updateNativeMediaNotification(true);
    return;
  }

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || "Unknown track",
      artist: trackNativeArtist(track),
      album: track.albumTitle || "Archive",
      artwork: [
        {
          src: absoluteAppUrl(track.cover || defaultCover),
          sizes: "512x512",
          type: "image/png"
        }
      ]
    });

    navigator.mediaSession.playbackState = playback.isPlaying ? "playing" : "paused";

    if ("setPositionState" in navigator.mediaSession && playback.duration) {
      try {
        navigator.mediaSession.setPositionState({
          duration: playback.duration,
          playbackRate: playback.audio.playbackRate || 1,
          position: Math.min(playback.time || playback.audio.currentTime || 0, playback.duration)
        });
      } catch {
        // Ignore unsupported position states.
      }
    }
  }

  void updateNativeMediaNotification(forceNative);
}

function setupMediaSessionControls() {
  if (!("mediaSession" in navigator)) return;

  const setHandler = (action, handler) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Some Android/WebView versions do not support every action.
    }
  };

  setHandler("play", () => {
    if (playback.current) startAudio();
  });

  setHandler("pause", () => {
    playback.audio.pause();
  });

  setHandler("previoustrack", () => {
    playPrevious();
  });

  setHandler("nexttrack", () => {
    playNext();
  });

  setHandler("seekbackward", (details) => {
    if (!playback.current) return;
    const offset = details.seekOffset || 10;
    playback.audio.currentTime = Math.max(0, playback.audio.currentTime - offset);
  });

  setHandler("seekforward", (details) => {
    if (!playback.current || !playback.duration) return;
    const offset = details.seekOffset || 10;
    playback.audio.currentTime = Math.min(playback.duration, playback.audio.currentTime + offset);
  });

  setHandler("seekto", (details) => {
    if (!playback.current || typeof details.seekTime !== "number") return;
    playback.time = details.seekTime;
    if (isNativePlaybackAvailable()) {
      void nativeSeek(details.seekTime);
    } else {
      playback.audio.currentTime = details.seekTime;
    }
    syncPlayerTime();
    updateMediaSession();
  });
}

setupNativeMediaBridge();
setupAndroidBackButton();
setupMediaSessionControls();

function albumPlayableTracks(album) {
  return album.tracks.filter((track) => !track.locked).map((track) => playableTrack(album, track));
}

function collectionTrackSignature(track) {
  return normalizeText(track?.title)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function collectionPlayableTracks(album) {
  const tracks = albumPlayableTracks(album);
  const baseReleaseId = collectionExtraOnlyReleaseBases[album.id];
  if (!baseReleaseId) return tracks;

  const baseRelease = getAlbum(baseReleaseId);
  if (!baseRelease) return tracks;

  const baseTrackSignatures = new Set(albumPlayableTracks(baseRelease).map(collectionTrackSignature));
  return tracks.filter((track) => !baseTrackSignatures.has(collectionTrackSignature(track)));
}

function allReleasesWithUnreleased() {
  return sortReleases(allAlbums());
}

function playAllWithUnreleasedRandomized() {
  state.includeUnreleasedInAllPlayback = true;
  playReleases(allReleasesWithUnreleased(), { randomize: true });
}

function renderShell(content) {
  app.innerHTML = `
    <div class="app-shell">
      ${content}
    </div>
  `;
  renderPlaylistPicker();
}

function setReleaseBackground(album) {
  const customBackground = album.background || "";
  const hasCustomBackground = Boolean(customBackground);
  const hasColorBackground = isCssColor(customBackground);
  const background = hasColorBackground ? album.cover || defaultCover : customBackground || album.cover || defaultCover;

  document.body.classList.add("release-open");
  document.body.classList.toggle("has-custom-background", hasCustomBackground);
  document.body.classList.toggle("has-color-background", hasColorBackground);
  document.body.style.setProperty("--release-cover-bg", cssImageUrl(background));
  document.body.style.setProperty("--release-accent", album.accent || "#ffffff");
  if (hasColorBackground) document.body.style.setProperty("--release-bg-fill", customBackground);
  else if (hasCustomBackground) applyDominantReleaseBackgroundFill(background);
}

function clearReleaseBackground() {
  releaseBackgroundColorRequestId += 1;
  document.body.classList.remove("release-open");
  document.body.classList.remove("has-custom-background");
  document.body.classList.remove("has-color-background");
  document.body.style.removeProperty("--release-cover-bg");
  document.body.style.removeProperty("--release-accent");
  document.body.style.removeProperty("--release-bg-fill");
}

let centerReleaseFocusFrame = 0;
let centeredReleaseCard = null;
let lastCenteredReleaseFocusAt = 0;

function shouldUseCenterReleaseFocus() {
  return (
    window.innerWidth <= 820 ||
    Boolean(window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches)
  );
}

function clearCenteredReleaseCard() {
  document.querySelectorAll(".album-card.is-scroll-centered").forEach((card) => {
    card.classList.remove("is-scroll-centered");
  });
  centeredReleaseCard = null;
}

function updateCenteredReleaseCard() {
  centerReleaseFocusFrame = 0;
  lastCenteredReleaseFocusAt = performance.now();

  const cards = Array.from(document.querySelectorAll(".album-grid .album-card"));
  if (!cards.length || !shouldUseCenterReleaseFocus()) {
    clearCenteredReleaseCard();
    return;
  }

  const viewportCenter = window.innerHeight * 0.5;
  let closestCard = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  let currentDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const cardCenter = rect.top + rect.height * 0.5;
    const distance = Math.abs(cardCenter - viewportCenter);
    if (card === centeredReleaseCard) currentDistance = distance;
    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  if (!closestCard) {
    clearCenteredReleaseCard();
    return;
  }

  const shouldKeepCurrent =
    centeredReleaseCard &&
    centeredReleaseCard.isConnected &&
    currentDistance < Number.POSITIVE_INFINITY &&
    currentDistance <= closestDistance + 132;

  const nextCenteredCard = shouldKeepCurrent ? centeredReleaseCard : closestCard;
  if (nextCenteredCard === centeredReleaseCard) return;

  centeredReleaseCard?.classList.remove("is-scroll-centered");
  nextCenteredCard.classList.add("is-scroll-centered");
  centeredReleaseCard = nextCenteredCard;
}

function scheduleCenteredReleaseFocusUpdate() {
  if (centerReleaseFocusFrame) return;

  const elapsed = performance.now() - lastCenteredReleaseFocusAt;
  const delay = Math.max(0, 90 - elapsed);

  centerReleaseFocusFrame = window.setTimeout(() => {
    centerReleaseFocusFrame = window.requestAnimationFrame(updateCenteredReleaseCard);
  }, delay);
}

function renderLibrary() {
  const releases = filteredAlbums();
  const songs = matchingSongs();
  document.title = "archive";
  clearCountdown();
  clearReleaseBackground();

  renderShell(`
    <header class="library-header">
      <div class="brand-lockup archive-gif-lockup">
        <img class="archive-gif-logo" src="/assets/brand-logo.png" alt="archive" />
      </div>
      ${burgerMenuMarkup()}
    </header>

    <section class="toolbar" aria-label="Library controls">
      <label class="search">
        <span>Search</span>
        <input id="search" type="search" value="${escapeHtml(state.query)}" placeholder="Release or track" autocomplete="off" />
      </label>
      <div class="filters" role="group" aria-label="Release type">
        ${filterButton("all", "All releases")}
        ${filterButton("album", "Albums")}
        ${filterButton("ep", "EPs")}
        ${filterButton("single", "Singles")}
        ${filterButton("unreleased", "Unreleased")}
      </div>
      ${sortControlMarkup()}
      ${yearFilterMarkup()}
    </section>

    ${state.query.trim() ? songResultsMarkup(songs) : ""}
    ${categoryPlaybackActions()}

    <main class="album-grid" aria-label="Release library">
      ${releases.map(albumCard).join("")}
    </main>
  `);

  scheduleFitReleaseTitles();
  scheduleCenteredReleaseFocusUpdate();
}

function burgerMenuMarkup() {
  return `
    <div class="header-menu">
      <button class="burger-button" type="button" data-menu-toggle aria-label="Open menu" aria-expanded="${state.menuOpen}" title="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav class="burger-menu${state.menuOpen ? " is-open" : ""}" aria-label="Archive menu">
        <a href="#/add" data-menu-link>Add Music</a>
        <a href="#/playlists" data-menu-link>Playlists</a>
        <button type="button" data-install-app>Install App</button>
      </nav>
    </div>
  `;
}

function categoryPlaybackActions() {
  const releases = playbackReleasesForCurrentView();
  const label = releaseScopeLabel();
  const playableCount = releases.flatMap((release) => release.tracks.filter((track) => !track.locked)).length;
  const unreleasedToggle =
    state.filter === "all"
      ? `
        <button class="thin-button" type="button" data-toggle-unreleased-playback aria-pressed="${state.includeUnreleasedInAllPlayback}">
          ${state.includeUnreleasedInAllPlayback ? "With unreleased" : "Without unreleased"}
        </button>
      `
      : "";

  return `
    <section class="release-actions" aria-label="${escapeHtml(label)} playback controls">
      <div class="release-action-summary">
        <span class="release-count-moved">${releases.length} ${releases.length === 1 ? "release" : "releases"}</span>
        <span>${pluralTracks(playableCount)}</span>
      </div>
      <div class="release-action-buttons">
        <button class="thin-button" type="button" data-play-current-view ${playableCount ? "" : "disabled"}>
          <span aria-hidden="true">${icons.play}</span>
          Play all
        </button>
        <button class="thin-button" type="button" data-randomize-current-view ${playableCount ? "" : "disabled"}>
          <span aria-hidden="true">${icons.shuffle}</span>
          Randomize
        </button>
        ${unreleasedToggle}
      </div>
    </section>
  `;
}

function releaseScopeLabel() {
  if (state.filter === "all") return "All releases";
  if (state.filter === "album") return "Albums";
  if (state.filter === "ep") return "EPs";
  if (state.filter === "single") return "Singles";
  if (state.filter === "unreleased") return "Unreleased";
  return "Releases";
}

function filterButton(value, label) {
  const active = state.filter === value ? " is-active" : "";
  return `<button class="filter${active}" type="button" data-filter="${value}">${label}</button>`;
}

function sortControlMarkup() {
  const options = [
    ["newest", "Newest first"],
    ["oldest", "Oldest first"],
    ["added", "Added recently"],
    ["title", "A-Z"]
  ];

  return `
    <label class="sort-control">
      <span>Sort</span>
      <select data-sort-mode aria-label="Sort releases">
        ${options
          .map(
            ([value, label]) =>
              `<option value="${value}" ${state.sortMode === value ? "selected" : ""}>${label}</option>`
          )
          .join("")}
      </select>
    </label>
  `;
}

function yearFilterMarkup() {
  const years = availableReleaseYears();
  if (!years.length) return "";
  const selected = new Set(state.yearFilters);

  return `
    <div class="year-filter" role="group" aria-label="Filter by year">
      <span class="year-filter-label">Year</span>
      <div class="year-options">
        ${years
          .map(
            (year) => `
              <label class="year-option${selected.has(year) ? " is-active" : ""}">
                <input type="checkbox" data-year-filter="${escapeHtml(year)}" ${selected.has(year) ? "checked" : ""} />
                <span>${escapeHtml(year)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function playlistArtworkMarkup(tracks, className = "playlist-artwork") {
  const covers = tracks.slice(0, 4).map((track) => track.cover || defaultCover);
  if (!covers.length) {
    return `<div class="${className} is-empty"><img src="${escapeHtml(defaultCover)}" alt="" /></div>`;
  }

  if (covers.length === 1) {
    return `<div class="${className} is-single"><img src="${escapeHtml(covers[0])}" alt="" /></div>`;
  }

  while (covers.length < 4) covers.push(covers[covers.length - 1]);
  return `
    <div class="${className} is-grid" aria-hidden="true">
      ${covers.map((cover) => `<img src="${escapeHtml(cover)}" alt="" loading="lazy" crossorigin="anonymous" />`).join("")}
    </div>
  `;
}

function playlistSidebarMarkup() {
  const favorites = favoriteTracks();
  const activePlaylist = getActivePlaylist();
  const favoriteActive = state.playlistPageMode === "favorites";

  return `
    <aside class="playlist-browser" aria-label="Your playlists">
      <div class="playlist-create">
        <input data-playlist-title type="text" placeholder="New playlist" autocomplete="off" aria-label="New playlist name" />
        <button class="playlist-create-button" type="button" data-create-playlist aria-label="Create playlist" title="Create playlist">
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <div class="playlist-browser-list">
        <button class="playlist-browser-item${favoriteActive ? " is-active" : ""}" type="button" data-open-favorites>
          ${playlistArtworkMarkup(favorites, "playlist-browser-art")}
          <span class="playlist-browser-copy">
            <strong>Liked Songs</strong>
            <small>${pluralTracks(favorites.length)}</small>
          </span>
        </button>

        ${playlists.map((playlist) => {
          const tracks = playlistTracks(playlist);
          const active = !favoriteActive && activePlaylist?.id === playlist.id;
          return `
            <button class="playlist-browser-item${active ? " is-active" : ""}" type="button" data-open-playlist="${escapeHtml(playlist.id)}">
              ${playlistArtworkMarkup(tracks, "playlist-browser-art")}
              <span class="playlist-browser-copy">
                <strong>${escapeHtml(playlist.title)}</strong>
                <small>${pluralTracks(tracks.length)}</small>
              </span>
            </button>
          `;
        }).join("")}
      </div>
    </aside>
  `;
}

function spotifyPlaylistTrackRows(tracks, options = {}) {
  const playlist = options.playlist || null;
  const favorites = options.favorites === true;
  if (!tracks.length) return `<div class="spotify-playlist-empty">No songs yet</div>`;

  return `
    <div class="spotify-track-list" role="list">
      ${tracks.map((track, index) => `
        <div class="spotify-track-row" role="listitem" data-track-key="${escapeHtml(track.key)}">
          <button class="spotify-track-index" type="button"
            ${favorites
              ? `data-play-favorite-index="${index}"`
              : `data-play-playlist-track="${escapeHtml(playlist.id)}" data-playlist-track-index="${index}"`}
            aria-label="Play ${escapeHtml(track.title)}" title="Play">
            <span class="spotify-track-number">${index + 1}</span>
            <span class="spotify-track-play" aria-hidden="true">${icons.play}</span>
          </button>
          <img class="spotify-track-cover" src="${escapeHtml(track.cover || defaultCover)}" alt="" loading="lazy" crossorigin="anonymous" />
          <div class="spotify-track-copy">
            <strong>${escapeHtml(track.title)}</strong>
            <small>${escapeHtml(trackProjectSubtitle(track) || track.albumTitle || "Local Music")}</small>
          </div>
          <span class="spotify-track-album">${escapeHtml(track.albumTitle || "")}</span>
          ${favorites
            ? `<button class="icon-button favorite-track is-saved spotify-track-remove" type="button" data-favorite-track="${escapeHtml(track.key)}" aria-pressed="true" aria-label="Remove ${escapeHtml(track.title)} from liked songs" title="Remove from Liked Songs"><span aria-hidden="true">${icons.favoriteFilled}</span></button>`
            : `<button class="icon-button spotify-track-remove" type="button" data-remove-playlist-track="${escapeHtml(playlist.id)}" data-playlist-track-index="${index}" aria-label="Remove ${escapeHtml(track.title)}" title="Remove from playlist"><span aria-hidden="true">${icons.remove}</span></button>`}
        </div>
      `).join("")}
    </div>
  `;
}

function playlistDetailMarkup() {
  if (state.playlistPageMode === "favorites") {
    const favorites = favoriteTracks();
    return `
      <section class="spotify-playlist-detail" aria-label="Liked Songs">
        <div class="spotify-playlist-hero">
          ${playlistArtworkMarkup(favorites, "spotify-playlist-art")}
          <div class="spotify-playlist-copy">
            <span class="spotify-playlist-type">Playlist</span>
            <h1>Liked Songs</h1>
            <p>${pluralTracks(favorites.length)}</p>
          </div>
        </div>
        <div class="spotify-playlist-actions">
          <button class="spotify-play-button" type="button" data-play-favorites ${favorites.length ? "" : "disabled"} aria-label="Play liked songs"><span aria-hidden="true">${icons.play}</span></button>
          <button class="thin-button" type="button" data-randomize-favorites ${favorites.length ? "" : "disabled"}><span aria-hidden="true">${icons.shuffle}</span> Shuffle</button>
        </div>
        ${spotifyPlaylistTrackRows(favorites, { favorites: true })}
      </section>
    `;
  }

  const playlist = getActivePlaylist();
  if (!playlist) {
    return `
      <section class="spotify-playlist-detail is-empty">
        <div class="spotify-playlist-empty">Create a playlist to get started.</div>
      </section>
    `;
  }

  const tracks = playlistTracks(playlist);
  return `
    <section class="spotify-playlist-detail" aria-label="${escapeHtml(playlist.title)}">
      <div class="spotify-playlist-hero">
        ${playlistArtworkMarkup(tracks, "spotify-playlist-art")}
        <div class="spotify-playlist-copy">
          <span class="spotify-playlist-type">Playlist</span>
          <h1>${escapeHtml(playlist.title)}</h1>
          <p>${pluralTracks(tracks.length)}</p>
        </div>
      </div>
      <div class="spotify-playlist-actions">
        <button class="spotify-play-button" type="button" data-play-playlist="${escapeHtml(playlist.id)}" ${tracks.length ? "" : "disabled"} aria-label="Play ${escapeHtml(playlist.title)}"><span aria-hidden="true">${icons.play}</span></button>
        <button class="thin-button" type="button" data-randomize-playlist="${escapeHtml(playlist.id)}" ${tracks.length ? "" : "disabled"}><span aria-hidden="true">${icons.shuffle}</span> Shuffle</button>
        <button class="thin-button spotify-delete-playlist" type="button" data-delete-playlist="${escapeHtml(playlist.id)}">Delete playlist</button>
      </div>
      ${spotifyPlaylistTrackRows(tracks, { playlist })}
    </section>
  `;
}

function playlistSectionMarkup() {
  return `
    <section class="spotify-playlist-shell">
      ${playlistSidebarMarkup()}
      ${playlistDetailMarkup()}
    </section>
  `;
}

function songResultsMarkup(songs) {
  return `
    <section class="song-results" aria-label="Song search results">
      <div class="section-heading">
        <h2>Song Matches</h2>
        <span>${pluralTracks(songs.length)}</span>
      </div>
      <div class="song-result-list">
        ${songs.length ? songs.map(songResultRow).join("") : `<div class="empty-results">No song matches</div>`}
      </div>
    </section>
  `;
}

function songResultRow(track) {
  const isCurrent = playback.current?.key === track.key;
  const isPlaying = isCurrent && playback.isPlaying;
  const subtitle = trackProjectSubtitle(track) || track.albumTitle;
  return `
    <div class="song-result${isCurrent ? " is-current" : ""}${isPlaying ? " is-playing" : ""}" data-track-key="${escapeHtml(track.key)}">
      <div class="track-play-cell">
        ${playButton(track, isPlaying)}
      </div>
      <span class="song-result-cover-frame">
        <img src="${escapeHtml(track.cover)}" alt="${escapeHtml(track.albumTitle)} cover" crossorigin="anonymous" />
      </span>
      <div class="song-result-copy">
        <strong>${escapeHtml(track.title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
      </div>
      <div class="track-actions">
        ${trackVideoButton(track)}
        ${favoriteButton(track)}
        ${playlistButton(track)}
        ${queueButton(track)}
      </div>
    </div>
  `;
}

function renderAlbum(album) {
  document.title = `${album.title} | archive`;
  const visibleTracks = album.tracks.map((track) => (track.locked ? track : playableTrack(album, track)));
  const playableCount = visibleTracks.filter((track) => !track.locked).length;
  const kindLabel = releaseKindLabel(album.kind);
  const primaryArtist = releasePrimaryArtist(album);
  const showTrackNumbers = ["album", "ep"].includes(normalizeText(album.kind));
  const showCount = showReleaseTrackCount(album);
  const showActions = showReleasePlaybackActions(album);
  setReleaseBackground(album);

  renderShell(`
    <header class="album-top">
      <a class="back-link" href="/" data-home-link>Back</a>
      <div class="album-stats">
        <span class="badge">${escapeHtml(kindLabel)}</span>
        ${showCount ? `<span class="track-count-inline">${pluralTracks(album.tracks.length)}</span>` : ""}
        ${album.releaseYear ? `<span class="release-year-inline">${escapeHtml(album.releaseYear)}</span>` : ""}
      </div>
    </header>

    <main class="album-page" style="--accent: ${escapeHtml(album.accent)}">
      <section class="album-hero">
        ${heroCoverMarkup(album)}
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(kindLabel)} ${escapeHtml(album.releaseYear || "")}</p>
          <h1 data-fit-title data-fit-edge=".hero-copy" data-fit-min="8">${escapeHtml(album.title)}</h1>
          ${primaryArtist ? `<p class="release-primary-artist">${escapeHtml(primaryArtist)}</p>` : ""}
          ${
            showActions
              ? `
                <div class="album-actions">
                  <button class="thin-button album-play" type="button" data-play-album="${escapeHtml(album.id)}" aria-label="Play ${escapeHtml(kindLabel)}" ${playableCount ? "" : "disabled"}>
                    <span aria-hidden="true">${icons.play}</span>
                    Play all
                  </button>
                  <button class="thin-button album-randomize" type="button" data-randomize-album="${escapeHtml(album.id)}" ${playableCount ? "" : "disabled"}>
                    <span aria-hidden="true">${icons.shuffle}</span>
                    Randomize
                  </button>
                  <button class="thin-button album-queue" type="button" data-queue-album="${escapeHtml(album.id)}" ${playableCount ? "" : "disabled"}>
                    Add ${escapeHtml(kindLabel)} to queue
                  </button>
                </div>
              `
              : ""
          }
        </div>
      </section>

      ${album.countdownTarget ? countdownMarkup(album) : ""}

      <section class="track-section" aria-label="${escapeHtml(album.title)} tracks">
        <div class="section-heading">
          <h2>Tracks</h2>
          ${showCount ? `<span>${pluralTracks(album.tracks.length)}</span>` : ""}
        </div>
        <div class="track-list">
          ${visibleTracks.map((track) => trackRow(track, showTrackNumbers)).join("")}
        </div>
      ${album.bottomGif ? `
        <section class="release-bottom-gif">
          <img src="${escapeHtml(album.bottomGif)}" alt="" loading="lazy" />
        </section>
      ` : ""}
      </section>
    </main>
  `);

  startCountdown();
  scheduleFitReleaseTitles();
}

function fitSingleLineTitle(title) {
  if (!title) return;

  title.style.removeProperty("font-size");
  title.style.removeProperty("letter-spacing");
  title.style.setProperty("white-space", "nowrap", "important");
  title.style.removeProperty("max-width");

  const computed = window.getComputedStyle(title);
  const initialSize = Number.parseFloat(computed.fontSize);
  if (!Number.isFinite(initialSize) || initialSize <= 0) return;

  const edgeSelector = title.dataset.fitEdge || "";
  const edge = edgeSelector ? title.closest(edgeSelector) : title.parentElement;
  if (edge) {
    const titleRect = title.getBoundingClientRect();
    const edgeRect = edge.getBoundingClientRect();
    const edgeStyle = window.getComputedStyle(edge);
    const fallbackLeftGap = Number.parseFloat(edgeStyle.paddingLeft || "0") || 0;
    const leftGap = Math.max(0, titleRect.left - edgeRect.left, fallbackLeftGap);
    const availableWidth = Math.max(40, edgeRect.right - titleRect.left - leftGap);
    title.style.setProperty("max-width", `${availableWidth}px`, "important");
  }

  const configuredMin = Number.parseFloat(title.dataset.fitMin || "");
  const minimumSize = Number.isFinite(configuredMin) && configuredMin > 0 ? configuredMin : Math.max(10, initialSize * 0.36);
  let size = initialSize;

  const shrinkToFit = (floor = minimumSize) => {
    while (size > floor && title.scrollWidth > title.clientWidth + 1) {
      size -= size > 24 ? 1 : 0.5;
      title.style.setProperty("font-size", `${size}px`, "important");
    }
  };

  shrinkToFit();

  if (title.scrollWidth > title.clientWidth + 1) {
    title.style.setProperty("letter-spacing", "0", "important");
    shrinkToFit(3.5);
  }
}

function fitReleaseTitles() {
  app.querySelectorAll("[data-fit-title]").forEach(fitSingleLineTitle);
}

function scheduleFitReleaseTitles() {
  requestAnimationFrame(() => {
    fitReleaseTitles();
    requestAnimationFrame(fitReleaseTitles);
    window.setTimeout(fitReleaseTitles, 90);
    window.setTimeout(fitReleaseTitles, 260);
  });
}

function renderAddPage() {
  document.title = "Add Music | archive";
  clearCountdown();
  clearReleaseBackground();

  renderShell(`
    <header class="album-top add-topbar">
      <a class="back-link" href="/" data-home-link>Back</a>
    </header>

    <main class="add-page add-page-clean">
      <form class="add-form add-form-clean" data-add-form action="/api/releases" method="post" enctype="multipart/form-data">
        <label>
          <span>Title</span>
          <input name="title" type="text" required autocomplete="off" placeholder="Song or release title" />
        </label>

        <label>
          <span>Artist</span>
          <input name="artist" type="text" autocomplete="off" placeholder="Artist" />
        </label>

        <fieldset class="kind-picker wide-field">
          <legend>Type</legend>
          <div class="kind-picker-options">
            <label><input type="radio" name="kind" value="Single" checked /><span>Single</span></label>
            <label><input type="radio" name="kind" value="Album" /><span>Album</span></label>
            <label><input type="radio" name="kind" value="EP" /><span>EP</span></label>
            <label><input type="radio" name="kind" value="Unreleased" /><span>Unreleased</span></label>
          </div>
        </fieldset>

        <label>
          <span>Release year</span>
          <input name="releaseYear" type="number" min="1900" max="2100" value="${new Date().getFullYear()}" required />
        </label>

        <label>
          <span>Cover</span>
          <input name="cover" type="file" accept="image/*" />
        </label>

        <label class="wide-field">
          <span>Audio</span>
          <input name="audio" type="file" accept=".mp3,audio/mpeg,.m4a,audio/mp4,.aac,audio/aac,.wav,audio/wav,.flac,audio/flac" multiple />
        </label>

        <div class="upload-preview wide-field" data-upload-preview>No files selected</div>
        <div class="upload-status wide-field" data-upload-status aria-live="polite"></div>
        <button class="thin-button submit-upload wide-field" type="submit">Add to library</button>
      </form>
    </main>
  `);
}

function renderVideosPage() {
  document.title = "Music Videos | archive";
  clearCountdown();
  clearReleaseBackground();
  const activeVideoSlug = getRouteVideoSlug();

  renderShell(`
    <header class="album-top">
      <a class="back-link" href="/" data-home-link>Back</a>
      <div class="album-stats">
        <span>${musicVideos.length} videos</span>
      </div>
    </header>

    <main class="videos-page">
      <section class="videos-hero">
        <h1>Music Videos</h1>
      </section>

      <section class="video-section" aria-label="Music Videos">
        <div class="video-grid">
          ${musicVideos.map((video) => videoCard(video, activeVideoSlug)).join("")}
        </div>
      </section>
    </main>
  `);

  void resolvePersistentVideoSources();
}

function renderPlaylistsPage() {
  document.title = "Playlists | archive";
  clearCountdown();
  clearReleaseBackground();

  renderShell(`
    <header class="album-top playlists-topbar">
      <a class="back-link" href="/" data-home-link>Back</a>
    </header>

    <main class="playlists-page spotify-playlists-page">
      <div class="playlist-page-head">
        <h1>Playlists</h1>
      </div>
      ${playlistSectionMarkup()}
    </main>
  `);
}

function favoritesPanelMarkup() {
  const favorites = favoriteTracks();

  return `
    <section class="playlist-panel favorites-panel" aria-label="Favorites">
      <div class="section-heading">
        <h2>Favorites</h2>
        <span>${pluralTracks(favorites.length)}</span>
      </div>
      <div class="playlist-tools compact-tools">
        <button class="thin-button" type="button" data-play-favorites ${favorites.length ? "" : "disabled"}>
          <span aria-hidden="true">${icons.play}</span>
          Play
        </button>
        <button class="thin-button" type="button" data-randomize-favorites ${favorites.length ? "" : "disabled"}>
          <span aria-hidden="true">${icons.shuffle}</span>
          Random
        </button>
      </div>
      <div class="playlist-track-list">
        ${favorites.length ? favorites.map(favoriteRowMarkup).join("") : `<div class="playlist-empty">No favorites</div>`}
      </div>
    </section>
  `;
}

function favoriteRowMarkup(track, index) {
  return `
    <div class="playlist-row" data-track-key="${escapeHtml(track.key)}">
      <button class="icon-button" type="button" data-play-favorite-index="${index}" aria-label="Play ${escapeHtml(track.title)}" title="Play">
        <span aria-hidden="true">${icons.play}</span>
      </button>
      <img src="${escapeHtml(track.cover || defaultCover)}" alt="${escapeHtml(track.albumTitle || track.title)} cover" loading="lazy" crossorigin="anonymous" />
      <div class="playlist-row-copy">
        <strong>${escapeHtml(track.title)}</strong>
        ${trackProjectSubtitle(track) ? `<small>${escapeHtml(trackProjectSubtitle(track))}</small>` : ""}
      </div>
      <button class="icon-button favorite-track is-saved" type="button" data-favorite-track="${escapeHtml(track.key)}" aria-pressed="true" aria-label="Remove ${escapeHtml(track.title)} from favorites" title="Remove from favorites">
        <span aria-hidden="true">${icons.favoriteFilled}</span>
      </button>
    </div>
  `;
}

function videoCard(video, activeVideoSlug = "") {
  const slug = videoSlug(video);
  const isTargeted = slug === activeVideoSlug;
  const poster = video.poster || videoPoster(video.youtubeId);
  return `
    <article class="video-card${isTargeted ? " is-targeted" : ""}" id="video-${escapeHtml(slug)}" data-video-slug="${escapeHtml(slug)}" tabindex="-1">
      <div class="video-frame">
        <video controls preload="metadata" playsinline webkit-playsinline data-local-video-src="${escapeHtml(video.src)}" poster="${escapeHtml(poster)}" title="${escapeHtml(video.title)}">
          <source src="${escapeHtml(video.src)}" type="video/mp4" />
        </video>
      </div>
      <h3>${escapeHtml(video.title)}</h3>
    </article>
  `;
}

function trackRow(track, showTrackNumbers = true) {
  const number = showTrackNumbers ? String(track.number).padStart(2, "0") : "";
  const titleClass = `track-title${showTrackNumbers ? "" : " no-number"}`;
  const numberMarkup = showTrackNumbers ? `<span>${number}</span>` : "";
  if (track.locked) {
    return `
      <div class="track-row is-locked">
        <div class="track-play-cell track-play-spacer" aria-hidden="true"></div>
        <div class="${titleClass}">
          ${numberMarkup}
          <strong>${escapeHtml(track.title)}</strong>
        </div>
        <span class="locked-label">-</span>
      </div>
    `;
  }

  const isCurrent = playback.current?.key === track.key;
  const isPlaying = isCurrent && playback.isPlaying;
  const videoAction = trackVideoButton(track);
  const subtitle = trackProjectSubtitle(track);
  return `
    <div class="track-row${videoAction ? " has-video-action" : ""}${isCurrent ? " is-current" : ""}${isPlaying ? " is-playing" : ""}" data-track-key="${escapeHtml(track.key)}">
      <div class="track-play-cell">
        ${playButton(track, isPlaying)}
      </div>
      <div class="${titleClass}">
        ${numberMarkup}
        <strong>${escapeHtml(track.title)}</strong>
        ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
      </div>
      ${videoAction ? `<div class="track-actions track-row-actions">${videoAction}</div>` : ""}
    </div>
  `;
}

function playButton(track, isPlaying) {
  const label = isPlaying ? "Pause" : "Play";
  return `
    <button class="icon-button play-track" type="button" data-play-track="${escapeHtml(track.key)}" aria-label="${label} ${escapeHtml(track.title)}" title="${label}">
      <span aria-hidden="true">${isPlaying ? icons.pause : icons.play}</span>
    </button>
  `;
}

function queueButton(track) {
  return `
    <button class="thin-button queue-track" type="button" data-queue-track="${escapeHtml(track.key)}">
      Add to queue
      <span class="queue-count" data-queue-count hidden></span>
    </button>
  `;
}

function favoriteButton(track) {
  const saved = isFavoriteTrack(track);
  return `
    <button class="thin-button favorite-track${saved ? " is-saved" : ""}" type="button" data-favorite-track="${escapeHtml(track.key)}" aria-pressed="${saved}" title="${saved ? "Remove from favorites" : "Save to favorites"}">
      <span aria-hidden="true">${saved ? icons.favoriteFilled : icons.favorite}</span>
      <span data-favorite-label>${saved ? "Saved" : "Favorite"}</span>
    </button>
  `;
}

function playlistButton(track) {
  return `
    <button class="thin-button playlist-track" type="button" data-playlist-track="${escapeHtml(track.key)}" title="Add to playlist">
      Playlist
    </button>
  `;
}

function trackVideoButton(track) {
  const video = musicVideoForTrack(track);
  if (!video) return "";

  return `
    <a class="icon-button track-video-link" href="${escapeHtml(videoUrl(video))}" aria-label="Open music video for ${escapeHtml(track.title)}" title="Music video">
      <span aria-hidden="true">${icons.video}</span>
    </a>
  `;
}

function renderNotFound() {
  document.title = "Not Found | archive";
  clearCountdown();
  clearReleaseBackground();
  renderShell(`
    <main class="not-found">
      <p class="eyebrow">Missing page</p>
      <h1>That release is not in the library.</h1>
      <a class="back-link" href="/" data-home-link>Back</a>
    </main>
  `);
}

function renderPlayerFull() {
  const current = playback.current;
  const progress = getProgressValue();
  const repeatLabel = getRepeatLabel();
  const subtitle = trackProjectSubtitle(current);
  const queueOpen = playback.queueOpen;
  document.body.classList.toggle("player-queue-open", queueOpen);
  const repeatModeText = playback.repeatMode === "track" ? "1" : "";

  playerRoot.innerHTML = `
    <section class="player-bar${current ? "" : " is-empty"}${queueOpen ? " queue-open" : ""}" aria-label="Now playing">
      <div
        class="player-drag-toggle"
        data-player-expand
        role="button"
        tabindex="0"
        draggable="false"
        aria-label="${queueOpen ? "Close player" : "Open player"}"
        aria-expanded="${queueOpen}"
        title="${queueOpen ? "Close player" : "Open player"}"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="player-cover-wrap">
        ${
          current
            ? `
              <a class="player-cover-link" href="#/album/${escapeHtml(current.albumId)}" aria-label="Open ${escapeHtml(current.albumTitle)}">
                <img class="player-cover" src="${escapeHtml(current.cover || defaultCover)}" alt="${escapeHtml(current.albumTitle)} cover" crossorigin="anonymous" />
              </a>
            `
            : `<div class="player-cover placeholder"></div>`
        }
      </div>

      <div class="player-main">
        <div class="player-meta">
          <strong class="player-title" data-player-title><span data-marquee-text="${current ? escapeHtml(current.title) : "No song selected"}">${current ? escapeHtml(current.title) : "No song selected"}</span></strong>
          ${
            current
              ? subtitle
                ? `<span>${escapeHtml(subtitle)}</span>`
                : ""
              : `<span>Choose a track to start</span>`
          }
        </div>
        ${
          current
            ? `<div class="player-action-buttons">
                <button class="icon-button player-favorite${isFavoriteTrack(current) ? " is-saved" : ""}" type="button" data-player-favorite aria-label="${isFavoriteTrack(current) ? "Remove from favorites" : "Save to favorites"}" title="${isFavoriteTrack(current) ? "Saved" : "Save to favorites"}" aria-pressed="${isFavoriteTrack(current)}">
                  <span aria-hidden="true">${isFavoriteTrack(current) ? icons.favoriteFilled : icons.favorite}</span>
                </button>
                <button class="icon-button player-playlist-add" type="button" data-player-playlist aria-label="Add current song to playlist" title="Add to playlist">
                  <span aria-hidden="true">${icons.plusCircle}</span>
                </button>
              </div>`
            : ""
        }
      </div>

      <div class="player-progress">
        <span data-player-time>${formatTime(playback.time)}</span>
        <input data-player-progress type="range" min="0" max="1000" value="${progress}" ${current ? "" : "disabled"} aria-label="Playback progress" />
        <span data-player-duration>${formatTime(playback.duration)}</span>
      </div>

      <div class="player-volume">
        <span>Vol</span>
        <input
          data-player-volume
          type="range"
          min="0"
          max="100"
          value="${Math.round(playback.volume * 100)}"
          aria-label="Volume"
        />
      </div>

      <div class="player-controls ipod-wheel" aria-label="Playback controls">
        <button class="icon-button wheel-shuffle" type="button" data-player-shuffle ${playback.queue.length ? "" : "disabled"} aria-label="Shuffle queue" title="Shuffle queue">
          <span aria-hidden="true">${icons.shuffle}</span>
        </button>

        <button class="icon-button wheel-prev" type="button" data-player-prev ${current ? "" : "disabled"} aria-label="Previous song" title="Previous song">
          <span aria-hidden="true">${icons.previous}</span>
        </button>

        <button class="icon-button wheel-toggle player-toggle" type="button" data-player-toggle ${current ? "" : "disabled"} aria-label="${playback.isPlaying ? "Pause" : "Play"}" title="${playback.isPlaying ? "Pause" : "Play"}">
          <span aria-hidden="true">${playback.isPlaying ? icons.pause : icons.play}</span>
        </button>

        <button class="icon-button wheel-next" type="button" data-player-next ${current || playback.queue.length ? "" : "disabled"} aria-label="Next song" title="Next song">
          <span aria-hidden="true">${icons.next}</span>
        </button>

        <div class="repeat-control wheel-repeat-control">
          <button class="icon-button wheel-repeat repeat-button" type="button" data-player-repeat data-repeat-mode="${escapeHtml(playback.repeatMode)}" aria-label="${escapeHtml(repeatLabel)}" title="${escapeHtml(repeatLabel)}" aria-pressed="true">
            <span aria-hidden="true">${icons.repeat}</span>
          </button>
          ${repeatModeText ? `<span class="repeat-mode-pill" aria-hidden="true">${repeatModeText}</span>` : ""}
        </div>
      </div>

      <div class="queue-panel${queueOpen ? " is-open" : ""}">
        <div class="queue-head">
          <span class="link-button queue-label">Queue ${playback.queue.length}</span>

          <button class="link-button" type="button" data-clear-queue ${playback.queue.length ? "" : "disabled"}>
            Clear
          </button>
        </div>

        ${queueOpen ? queueEditorMarkup() : ""}
      </div>
    </section>
  `;

  syncPlayerTime();
  schedulePlayerTitleMarquee();
  persistPlaybackState();
}


/* Android WebView stability: keep the already-painted player DOM alive when
   only track/queue/repeat data changes. Rebuilding playerRoot.innerHTML for
   every native skip forces WebView to destroy/recreate the wheel, cover and
   composited surfaces, which can produce a visible white/empty flash. */
function syncExistingNativePlayer() {
  if (!isNativePlaybackAvailable()) return false;

  const bar = playerRoot.querySelector(".player-bar");
  if (!bar) return false;

  const current = playback.current;
  const queueOpen = Boolean(playback.queueOpen);
  const domIsEmpty = bar.classList.contains("is-empty");
  const domQueueOpen = bar.classList.contains("queue-open");

  // These two state changes alter the actual layout/markup and still need a
  // full render. Normal next/previous/repeat/queue updates stay in place.
  if (domIsEmpty !== !current || domQueueOpen !== queueOpen || !current) return false;

  document.body.classList.toggle("player-queue-open", queueOpen);

  const coverWrap = bar.querySelector(".player-cover-wrap");
  const coverLink = coverWrap?.querySelector(".player-cover-link");
  const coverImage = coverWrap?.querySelector(".player-cover");
  if (!coverWrap || !coverLink || !coverImage) return false;

  const coverSrc = current.cover || defaultCover;
  coverLink.setAttribute("href", `#/album/${current.albumId}`);
  coverLink.setAttribute("aria-label", `Open ${current.albumTitle}`);
  coverImage.setAttribute("alt", `${current.albumTitle} cover`);

  // Keep the old cover painted until the next local image is ready. This
  // prevents the cover layer itself from blinking during a fast skip.
  if (coverImage.getAttribute("src") !== coverSrc) {
    const targetKey = current.key;
    const preloadedCover = new Image();
    const commitCover = () => {
      if (playback.current?.key !== targetKey) return;
      const liveImage = playerRoot.querySelector(".player-cover");
      if (liveImage) liveImage.setAttribute("src", coverSrc);
    };
    preloadedCover.addEventListener("load", commitCover, { once: true });
    preloadedCover.src = coverSrc;
    if (preloadedCover.complete && preloadedCover.naturalWidth > 0) commitCover();
  }

  const title = bar.querySelector("[data-player-title]");
  const titleText = title?.querySelector("span");
  if (!title || !titleText) return false;
  titleText.textContent = current.title;
  titleText.dataset.marqueeText = current.title;

  const meta = bar.querySelector(".player-meta");
  if (!meta) return false;
  const metaContent = meta.querySelector(".player-meta-content") || meta;
  const subtitle = trackProjectSubtitle(current);
  let subtitleNode = Array.from(metaContent.children).find((child) => child.tagName === "SPAN") || null;
  if (subtitle) {
    if (!subtitleNode) {
      subtitleNode = document.createElement("span");
      metaContent.append(subtitleNode);
    }
    subtitleNode.textContent = subtitle;
  } else {
    subtitleNode?.remove();
  }

  const favorite = bar.querySelector("[data-player-favorite]");
  if (favorite) {
    const saved = isFavoriteTrack(current);
    favorite.classList.toggle("is-saved", saved);
    favorite.setAttribute("aria-label", saved ? "Remove from favorites" : "Save to favorites");
    favorite.setAttribute("title", saved ? "Saved" : "Save to favorites");
    favorite.setAttribute("aria-pressed", String(saved));
    const favoriteIcon = favorite.querySelector("span");
    if (favoriteIcon) favoriteIcon.innerHTML = saved ? icons.favoriteFilled : icons.favorite;
  }

  const progress = bar.querySelector("[data-player-progress]");
  if (progress) progress.disabled = false;

  const previousButton = bar.querySelector("[data-player-prev]");
  if (previousButton) previousButton.disabled = false;

  const nextButton = bar.querySelector("[data-player-next]");
  if (nextButton) nextButton.disabled = !(current || playback.queue.length);

  const shuffleButton = bar.querySelector("[data-player-shuffle]");
  if (shuffleButton) shuffleButton.disabled = !playback.queue.length;

  const repeatButton = bar.querySelector("[data-player-repeat]");
  if (repeatButton) {
    const repeatLabel = getRepeatLabel();
    repeatButton.dataset.repeatMode = playback.repeatMode;
    repeatButton.setAttribute("aria-label", repeatLabel);
    repeatButton.setAttribute("title", repeatLabel);
    repeatButton.setAttribute("aria-pressed", "true");

    const repeatControl = repeatButton.closest(".repeat-control");
    let repeatPill = repeatControl?.querySelector(".repeat-mode-pill") || null;
    const repeatModeText = playback.repeatMode === "track" ? "1" : "";
    if (repeatModeText) {
      if (!repeatPill && repeatControl) {
        repeatPill = document.createElement("span");
        repeatPill.className = "repeat-mode-pill";
        repeatPill.setAttribute("aria-hidden", "true");
        repeatControl.append(repeatPill);
      }
      if (repeatPill) repeatPill.textContent = repeatModeText;
    } else {
      repeatPill?.remove();
    }
  }

  const queuePanel = bar.querySelector(".queue-panel");
  if (queuePanel) {
    queuePanel.classList.toggle("is-open", queueOpen);
    const queueLabel = queuePanel.querySelector(".queue-label");
    if (queueLabel) queueLabel.textContent = `Queue ${playback.queue.length}`;
    const clearQueueButton = queuePanel.querySelector("[data-clear-queue]");
    if (clearQueueButton) clearQueueButton.disabled = !playback.queue.length;

    if (queueOpen) {
      const holder = document.createElement("div");
      holder.innerHTML = queueEditorMarkup().trim();
      const nextEditor = holder.firstElementChild;
      const currentEditor = queuePanel.querySelector(".queue-editor");
      if (nextEditor && currentEditor) currentEditor.replaceWith(nextEditor);
      else if (nextEditor) queuePanel.append(nextEditor);
    } else {
      queuePanel.querySelector(".queue-editor")?.remove();
    }
  }

  syncPlayerPlaybackControls();
  syncPlayerTime();
  schedulePlayerTitleMarquee();
  persistPlaybackState();
  return true;
}

function renderPlayer() {
  if (syncExistingNativePlayer()) return;
  renderPlayerFull();
}

function syncPlayerPlaybackControls() {
  const toggle = playerRoot.querySelector("[data-player-toggle]");
  if (!toggle) return;

  const label = playback.isPlaying ? "Pause" : "Play";
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("title", label);
  const icon = toggle.querySelector("span");
  if (icon) icon.innerHTML = playback.isPlaying ? icons.pause : icons.play;
  persistPlaybackState();
}

let playerTitleMarqueeFrame = 0;
let playerTitleMarqueeRetry = 0;
let playerTitleMarqueeAnimation = null;

/* Exact wheel-parallel text boundary.
   This does NOT resize, reposition, or vertically align the text box.
   It only extends the existing metadata clipping surface far enough to overlap
   the wheel, then clips the pixels to the LEFT of a circle that is concentric
   with the REAL wheel and exactly 5px larger in radius. */
function updatePlayerWheelTextBoundary() {
  const bar = playerRoot.querySelector(".player-bar");
  const meta = bar?.querySelector(".player-meta");
  const wheel = bar?.querySelector(".player-controls.ipod-wheel, .ipod-wheel");
  if (!bar || !meta || !wheel) return;

  // Clear every older boundary implementation first. The title/subtitle layout
  // and the wheel position are intentionally left untouched.
  for (const property of [
    "width",
    "max-width",
    "clip-path",
    "-webkit-clip-path",
    "mask-image",
    "-webkit-mask-image",
    "mask-size",
    "-webkit-mask-size",
    "mask-repeat",
    "-webkit-mask-repeat"
  ]) {
    meta.style.removeProperty(property);
  }

  const wheelRect = wheel.getBoundingClientRect();
  const naturalMetaRect = meta.getBoundingClientRect();
  if (!wheelRect.width || !wheelRect.height || !naturalMetaRect.width || !naturalMetaRect.height) return;

  const clearance = 5;
  // The wheel is circular, so use its actual rendered diameter. Adding 5px to
  // the radius creates a truly parallel circle exactly 5px outside the wheel.
  const wheelRadius = Math.min(wheelRect.width, wheelRect.height) / 2;
  const boundaryRadius = wheelRadius + clearance;
  const wheelCenterX = wheelRect.left + wheelRect.width / 2;
  const wheelCenterY = wheelRect.top + wheelRect.height / 2;

  // The metadata paint surface has to reach under the wheel so the mask can
  // cut the text against the real circle. This does not move the grid track,
  // the wheel, or the text's left/top position.
  const neededWidth = Math.max(
    naturalMetaRect.width,
    wheelRect.right + clearance - naturalMetaRect.left
  );
  meta.style.setProperty("width", `${neededWidth}px`, "important");
  meta.style.setProperty("max-width", "none", "important");

  const rect = meta.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const centerX = wheelCenterX - rect.left;
  const centerY = wheelCenterY - rect.top;

  // IMPORTANT: this is a real circular alpha mask, not a polygon. Everything
  // inside the 5px-expanded concentric wheel circle is transparent; everything
  // outside stays fully visible. The boundary itself has no visible stroke.
  const feather = 0.35;
  const mask = `radial-gradient(circle ${boundaryRadius.toFixed(3)}px at ${centerX.toFixed(3)}px ${centerY.toFixed(3)}px, transparent 0 ${(boundaryRadius - feather).toFixed(3)}px, rgba(0,0,0,1) ${(boundaryRadius + feather).toFixed(3)}px 100%)`;

  meta.style.setProperty("-webkit-mask-image", mask, "important");
  meta.style.setProperty("mask-image", mask, "important");
  meta.style.setProperty("-webkit-mask-repeat", "no-repeat", "important");
  meta.style.setProperty("mask-repeat", "no-repeat", "important");
  meta.style.setProperty("-webkit-mask-size", "100% 100%", "important");
  meta.style.setProperty("mask-size", "100% 100%", "important");
}

function playerTitleVisibleWidth(title) {
  const meta = title?.closest(".player-meta");
  const wheel = playerRoot.querySelector(".player-controls.ipod-wheel, .ipod-wheel");
  if (!title || !meta || !wheel) {
    return Math.ceil(title?.getBoundingClientRect().width || title?.clientWidth || 0);
  }

  const titleRect = title.getBoundingClientRect();
  const wheelRect = wheel.getBoundingClientRect();
  if (!wheelRect.width || !wheelRect.height) {
    return Math.ceil(titleRect.width || title.clientWidth || 0);
  }

  const clearance = 5;
  const radius = Math.max(wheelRect.width, wheelRect.height) / 2 + clearance;
  const wheelCenterX = wheelRect.left + wheelRect.width / 2;
  const wheelCenterY = wheelRect.top + wheelRect.height / 2;
  const titleCenterY = titleRect.top + titleRect.height / 2;
  const dy = Math.min(radius, Math.abs(titleCenterY - wheelCenterY));
  const halfChord = Math.sqrt(Math.max(0, radius * radius - dy * dy));
  const boundaryX = wheelCenterX - halfChord;

  return Math.max(0, Math.ceil(boundaryX - titleRect.left));
}

function updatePlayerTitleMarquee() {
  updatePlayerWheelTextBoundary();
  const title = playerRoot.querySelector("[data-player-title]");
  if (!title) return;
  const text = title.querySelector("span") || title;
  const previousAnimation = text.style.animation;
  const previousTransform = text.style.transform;
  text.style.animation = "none";
  text.style.transform = "translateX(0)";
  const availableWidth = playerTitleVisibleWidth(title);
  const textRange = document.createRange();
  textRange.selectNodeContents(text);
  const textWidth = Math.ceil(textRange.getBoundingClientRect().width || text.scrollWidth);
  const overflowDistance = Math.ceil(Math.max(0, textWidth - availableWidth));
  const overflowing = availableWidth > 0 && overflowDistance > 3;
  const offset = `${-overflowDistance}px`;
  text.style.animation = previousAnimation;
  text.style.transform = previousTransform;

  if (availableWidth <= 0 || textWidth <= 0) {
    window.clearTimeout(playerTitleMarqueeRetry);
    playerTitleMarqueeRetry = window.setTimeout(() => {
      playerTitleMarqueeRetry = 0;
      schedulePlayerTitleMarquee();
    }, 180);
    return;
  }

  if (title.style.getPropertyValue("--player-title-offset") !== offset) {
    title.style.setProperty("--player-title-offset", offset);
  }

  if (title.classList.contains("is-overflowing") !== overflowing) {
    title.classList.toggle("is-overflowing", overflowing);
  }

  playerTitleMarqueeAnimation?.cancel();
  playerTitleMarqueeAnimation = null;

  if (overflowing && typeof text.animate === "function") {
    const gap = 48;
    const travel = textWidth + gap;
    const travelDuration = (travel / 20) * 1000;
    const pauseDuration = 3000;
    const totalDuration = pauseDuration + travelDuration;
    const pauseOffset = pauseDuration / totalDuration;

    title.style.setProperty("--player-title-gap", `${gap}px`);
    playerTitleMarqueeAnimation = text.animate(
      [
        { transform: "translate3d(0, 0, 0)", offset: 0 },
        { transform: "translate3d(0, 0, 0)", offset: pauseOffset },
        { transform: `translate3d(${-travel}px, 0, 0)`, offset: 1 }
      ],
      { duration: totalDuration, iterations: Infinity, easing: "linear" }
    );
  }
}

function schedulePlayerTitleMarquee() {
  if (playerTitleMarqueeFrame) return;
  playerTitleMarqueeFrame = requestAnimationFrame(() => {
    playerTitleMarqueeFrame = requestAnimationFrame(() => {
      playerTitleMarqueeFrame = 0;
      updatePlayerTitleMarquee();
    });
  });
}

function queueEditorMarkup() {
  if (!playback.queue.length) {
    return `<div class="queue-editor"><span class="queue-empty">Queue is empty</span></div>`;
  }

  return `
    <div class="queue-editor">
      ${playback.queue
        .map(
          (track, index) => `
            <div class="queue-editor-row">
              <button class="icon-button queue-row-play" type="button" data-play-queue-index="${index}" aria-label="Play ${escapeHtml(track.title)}" title="Play">
                <span aria-hidden="true">${icons.play}</span>
              </button>
              <img class="queue-editor-cover" src="${escapeHtml(track.cover || defaultCover)}" alt="${escapeHtml(track.albumTitle || track.title)} cover" loading="lazy" crossorigin="anonymous" />
              <div class="queue-editor-copy">
                <strong>${escapeHtml(track.title)}</strong>
                ${trackProjectSubtitle(track) ? `<small>${escapeHtml(trackProjectSubtitle(track))}</small>` : ""}
              </div>
              <div class="queue-editor-actions">
                <button class="icon-button" type="button" data-move-queue-index="${index}" data-queue-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeHtml(track.title)} up" title="Move up">
                  <span aria-hidden="true">${icons.up}</span>
                </button>
                <button class="icon-button" type="button" data-move-queue-index="${index}" data-queue-direction="1" ${index === playback.queue.length - 1 ? "disabled" : ""} aria-label="Move ${escapeHtml(track.title)} down" title="Move down">
                  <span aria-hidden="true">${icons.down}</span>
                </button>
                <button class="icon-button" type="button" data-remove-queue-index="${index}" aria-label="Remove ${escapeHtml(track.title)} from queue" title="Remove">
                  <span aria-hidden="true">${icons.remove}</span>
                </button>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function playTrack(track, options = {}) {
  const remember = options.remember !== false;
  const preserveRepeatQueue = options.preserveRepeatQueue === true;

  if (playback.current?.key === track.key) {
    if (isNativePlaybackAvailable()) {
      if (playback.isPlaying) void nativePause();
      else void nativePlayFromShownTime();
      return;
    }

    if (playback.audio.paused) startAudio();
    else playback.audio.pause();
    return;
  }

  if (playback.current) {
    if (remember) playback.history.push(playback.current);
    playback.ignorePause = true;
    playback.audio.pause();
    playback.audio.currentTime = 0;
  }

  playback.current = track;
  playback.duration = 0;
  playback.time = 0;

  if (!preserveRepeatQueue) setRepeatQueue([track, ...playback.queue]);

  if (isNativePlaybackAvailable()) {
    playback.audio.removeAttribute("src");
    playback.isPlaying = true;
    renderPlayer();
    updateTrackStates();
    updateMediaSession(true);
    void nativePlayQueueFromState(0);
    return;
  }

  playback.audio.src = track.src;
  playback.audio.currentTime = 0;
  updateMediaSession(true);
  startAudio();
}

function startAudio() {
  if (isNativePlaybackAvailable() && playback.current) {
    void nativePlayFromShownTime();
    return;
  }

  ensureHtmlAudioSourceForCurrentTrack();
  seekHtmlAudioToShownTime();

  playback.isPlaying = true;
  renderPlayer();
  updateTrackStates();
  playback.audio
    .play()
    .then(() => {
      playback.ignorePause = false;
      updateMediaSession(true);
    })
    .catch(() => {
      playback.ignorePause = false;
      playback.isPlaying = false;
      renderPlayer();
      updateTrackStates();
      updateMediaSession();
    });
}

function addToQueue(track) {
  if (!playback.current) {
    playTrack(track);
    return;
  }
  playback.queue.push(track);
  appendToRepeatQueue([track]);
  renderPlayer();
  updateTrackStates();
  void nativeSyncQueueOnly();
}

function playAlbum(album, options = {}) {
  const tracks = albumPlayableTracks(album);
  if (!tracks.length) return;
  const nextTracks = options.randomize ? shuffleTracks(tracks) : tracks;
  playback.history = [];
  playback.queue = nextTracks.slice(1);
  setRepeatQueue(nextTracks);
  playTrack(nextTracks[0], { preserveRepeatQueue: true, remember: false });
  renderPlayer();
  updateTrackStates();
}

function addAlbumToQueue(album) {
  const tracks = albumPlayableTracks(album);
  if (!tracks.length) return;
  playback.queue.push(...tracks);
  if (playback.current) appendToRepeatQueue(tracks);
  else setRepeatQueue(tracks);
  if (!playback.current) {
    playNext();
    return;
  }
  renderPlayer();
  updateTrackStates();
  void nativeSyncQueueOnly();
}

function syncRepeatQueueWithEditedQueue() {
  setRepeatQueue(playback.current ? [playback.current, ...playback.queue] : playback.queue);
}

let playerTransitionTimer = 0;
const playerDragGesture = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0
};
let suppressNextPlayerExpandClick = false;

function renderPlayerWithTransition() {
  renderPlayer();
}

function toggleQueuePanel() {
  playback.queueOpen = !playback.queueOpen;
  renderPlayerWithTransition();
}

function finishPlayerDragGesture(event) {
  if (!playerDragGesture.active || event.pointerId !== playerDragGesture.pointerId) return;

  const deltaX = event.clientX - playerDragGesture.startX;
  const deltaY = event.clientY - playerDragGesture.startY;
  const isVerticalSwipe = Math.abs(deltaY) > 22 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25;

  playerDragGesture.active = false;
  playerDragGesture.pointerId = null;
  playerRoot.classList.remove("is-player-dragging");

  if (!isVerticalSwipe) return;

  const shouldOpen = deltaY < 0;
  if (playback.queueOpen !== shouldOpen) {
    playback.queueOpen = shouldOpen;
    renderPlayerWithTransition();
  }

  suppressNextPlayerExpandClick = true;
  window.setTimeout(() => {
    suppressNextPlayerExpandClick = false;
  }, 180);
}

function removeQueueItem(index) {
  if (!Number.isInteger(index) || index < 0 || index >= playback.queue.length) return;
  playback.queue.splice(index, 1);
  syncRepeatQueueWithEditedQueue();
  renderPlayer();
  updateTrackStates();
  void nativeSyncQueueOnly();
}

function moveQueueItem(index, direction) {
  const targetIndex = index + direction;
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(direction) ||
    index < 0 ||
    targetIndex < 0 ||
    index >= playback.queue.length ||
    targetIndex >= playback.queue.length
  ) {
    return;
  }

  [playback.queue[index], playback.queue[targetIndex]] = [playback.queue[targetIndex], playback.queue[index]];
  syncRepeatQueueWithEditedQueue();
  renderPlayer();
  updateTrackStates();
  void nativeSyncQueueOnly();
}

function playQueueItem(index) {
  if (!Number.isInteger(index) || index < 0 || index >= playback.queue.length) return;
  const [track] = playback.queue.splice(index, 1);
  if (!track) return;
  playTrack(track, { preserveRepeatQueue: true });
  syncRepeatQueueWithEditedQueue();
  renderPlayer();
  updateTrackStates();
  void nativePlayQueueFromState(0);
}

function playReleases(releases, options = {}) {
  const tracks = releases.flatMap((release) => collectionPlayableTracks(release));
  const nextTracks = options.randomize ? shuffleTracks(tracks) : tracks;
  if (!nextTracks.length) return;
  playback.history = [];
  playback.queue = nextTracks.slice(1);
  setRepeatQueue(nextTracks);
  playTrack(nextTracks[0], { preserveRepeatQueue: true, remember: false });
  renderPlayer();
  updateTrackStates();
}

function shuffleTracks(tracks) {
  const shuffled = tracks.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function shuffleCurrentQueue() {
  if (!playback.queue.length) return;
  playback.queue = shuffleTracks(playback.queue);
  syncRepeatQueueWithEditedQueue();
  if (playback.queueOpen) renderPlayer();
  else persistPlaybackState();
  updateTrackStates();
  void nativeSyncQueueOnly();
}

function stopPlaybackAtQueueEnd() {
  if (playback.current) {
    playback.audio.pause();
    playback.audio.currentTime = 0;
  }

  playback.current = null;
  playback.isPlaying = false;
  playback.duration = 0;
  playback.time = 0;
  playback.audio.removeAttribute("src");
  playback.audio.load();
  updateMediaSession();
  renderPlayer();
  updateTrackStates();
}

function takeNextQueuedTrack() {
  const next = playback.queue.shift();
  if (next) return next;

  if (playback.repeatMode === "queue" && playback.repeatQueue.length) {
    playback.queue = playback.repeatQueue.slice();
    return playback.queue.shift() || null;
  }

  return null;
}

function playNext({ fromAutoEnd = false } = {}) {
  if (isNativePlaybackAvailable() && playback.current && !fromAutoEnd) {
    void nativeNext();
    return;
  }

  const next = takeNextQueuedTrack();

  if (next) {
    playTrack(next, { preserveRepeatQueue: true, forcePlay: fromAutoEnd });
    return;
  }

  if (fromAutoEnd && playback.current) {
    const endedTrack = playback.current;

    window.setTimeout(() => {
      if (playback.current !== endedTrack) return;

      const retryNext = takeNextQueuedTrack();

      if (retryNext) {
        playTrack(retryNext, { preserveRepeatQueue: true, forcePlay: true });
        return;
      }

      stopPlaybackAtQueueEnd();
    }, 750);

    return;
  }

  stopPlaybackAtQueueEnd();
}

function playPrevious() {
  if (!playback.current) return;

  if (isNativePlaybackAvailable()) {
    void nativePrevious();
    return;
  }

  if (!playback.history.length) {
    playback.audio.currentTime = 0;
    playback.time = 0;
    syncPlayerTime();
    return;
  }

  const previous = playback.history.pop();
  if (!previous) return;
  playback.queue.unshift(playback.current);
  playTrack(previous, { remember: false, preserveRepeatQueue: true });
}

function setRepeatQueue(tracks) {
  playback.repeatQueue = tracks.filter(Boolean);
}

function appendToRepeatQueue(tracks) {
  const nextTracks = tracks.filter(Boolean);
  if (!nextTracks.length) return;
  if (!playback.repeatQueue.length && playback.current) {
    setRepeatQueue([playback.current, ...playback.queue]);
    return;
  }
  playback.repeatQueue.push(...nextTracks);
}

function cycleRepeatMode() {
  const modes = ["queue", "track"];
  const currentIndex = modes.indexOf(playback.repeatMode);
  playback.repeatMode = modes[((currentIndex >= 0 ? currentIndex : 0) + 1) % modes.length];
  if (playback.repeatMode === "queue" && !playback.repeatQueue.length && playback.current) {
    setRepeatQueue([playback.current, ...playback.queue]);
  }
  renderPlayer();
  void nativeSetRepeatMode();
}

function getRepeatLabel() {
  if (playback.repeatMode === "track") return "Repeat current song";
  return "Repeat queue";
}

function restartCurrentTrack() {
  if (!playback.current) return;

  if (isNativePlaybackAvailable()) {
    playback.time = 0;
    void nativePlayFromShownTime();
    return;
  }

  playback.audio.currentTime = 0;
  playback.time = 0;
  startAudio();
}

let autoAdvanceLock = false;

function handleTrackEnded() {
  if (autoAdvanceLock) return;
  autoAdvanceLock = true;

  window.setTimeout(() => {
    autoAdvanceLock = false;
  }, 900);

  if (playback.repeatMode === "track" && playback.current) {
    restartCurrentTrack();
    return;
  }

  playNext({ fromAutoEnd: true });
}

function setupQueueAutoAdvanceWatchdog() {
  window.setInterval(() => {
    if (!playback.current || playback.audio.paused || !playback.duration) return;

    const currentTime = playback.audio.currentTime || playback.time || 0;
    const remaining = playback.duration - currentTime;

    if (remaining <= 0.35) {
      handleTrackEnded();
    }
  }, 1000);
}

setupQueueAutoAdvanceWatchdog();

function updateTrackStates() {
  document.querySelectorAll("[data-track-key]").forEach((row) => {
    const key = row.dataset.trackKey;
    const isCurrent = playback.current?.key === key;
    const queuedCount = playback.queue.filter((track) => track.key === key).length;
    const playButtonElement = row.querySelector("[data-play-track]");
    const queueCount = row.querySelector("[data-queue-count]");

    row.classList.toggle("is-current", isCurrent);
    row.classList.toggle("is-playing", isCurrent && playback.isPlaying);
    if (playButtonElement) {
      const label = isCurrent && playback.isPlaying ? "Pause" : "Play";
      const title = row.querySelector(".track-title strong, .song-result-copy strong")?.textContent || "track";
      playButtonElement.setAttribute("aria-label", `${label} ${title}`);
      playButtonElement.setAttribute("title", label);
      playButtonElement.querySelector("span").innerHTML = isCurrent && playback.isPlaying ? icons.pause : icons.play;
    }
    if (queueCount) {
      queueCount.hidden = queuedCount === 0;
      queueCount.textContent = queuedCount ? String(queuedCount) : "";
    }
  });
  updateFavoriteStates();
}

function updateFavoriteStates() {
  document.querySelectorAll("[data-favorite-track]").forEach((button) => {
    const track = trackLookup.get(button.dataset.favoriteTrack);
    const saved = isFavoriteTrack(track);
    const icon = button.querySelector("span[aria-hidden='true']");
    const label = button.querySelector("[data-favorite-label]");

    button.classList.toggle("is-saved", saved);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("title", saved ? "Remove from favorites" : "Save to favorites");
    if (icon) icon.innerHTML = saved ? icons.favoriteFilled : icons.favorite;
    if (label) label.textContent = saved ? "Saved" : "Favorite";
  });

  const playerFavorite = playerRoot.querySelector("[data-player-favorite]");
  if (playerFavorite && playback.current) {
    const saved = isFavoriteTrack(playback.current);
    const icon = playerFavorite.querySelector("span[aria-hidden='true']");
    playerFavorite.classList.toggle("is-saved", saved);
    playerFavorite.setAttribute("aria-pressed", String(saved));
    playerFavorite.setAttribute("aria-label", saved ? "Remove from favorites" : "Save to favorites");
    playerFavorite.setAttribute("title", saved ? "Saved" : "Save to favorites");
    if (icon) icon.innerHTML = saved ? icons.favoriteFilled : icons.favorite;
  }
}

function updateUploadPreview() {
  const form = app.querySelector("[data-add-form]");
  const preview = app.querySelector("[data-upload-preview]");
  if (!form || !preview) return;

  const cover = form.elements.cover.files[0]?.name;
  const files = [...form.elements.audio.files].map((file) => file.name);
  const rows = [cover ? `Cover: ${cover}` : null, ...files].filter(Boolean);
  preview.innerHTML = rows.length ? rows.map((name) => `<span>${escapeHtml(name)}</span>`).join("") : "No files selected";
}

async function submitUpload(form) {
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const artist = String(formData.get("artist") || "").trim();
  const kind = String(formData.get("kind") || "Single");
  const releaseYear = String(formData.get("releaseYear") || new Date().getFullYear());
  const submitButton = form.querySelector("[type='submit']");
  const status = form.querySelector("[data-upload-status]");
  if (!title) return;

  if (submitButton) submitButton.disabled = true;
  if (status) status.textContent = "Saving on this device...";

  try {
    const id = `${slugify(title) || "release"}-${Date.now()}`;
    const coverFile = form.elements.cover.files[0];
    const audioFiles = [...form.elements.audio.files];
    const storedTracks = audioFiles.map((file, index) => ({
      number: index + 1,
      title: cleanLocalTrackTitle(file.name, title, kind, index),
      file
    }));
    const displayTracks = storedTracks.map((track) => ({
      number: track.number,
      title: track.title,
      src: URL.createObjectURL(track.file)
    }));

    if (!displayTracks.length) displayTracks.push({ number: 1, title: "No audio files", locked: true });

    const release = {
      id,
      title,
      kind,
      releaseYear,
      releaseDate: releaseYear,
      cover: coverFile ? URL.createObjectURL(coverFile) : defaultCover,
      accent: "#f7f7f2",
      artist,
      primaryArtist: artist,
      tracks: displayTracks
    };

    if ("indexedDB" in window) {
      await saveReleaseOnDevice({
        id,
        title,
        kind,
        releaseYear,
        releaseDate: releaseYear,
        coverFile: coverFile || null,
        accent: "#f7f7f2",
        artist,
        primaryArtist: artist,
        tracks: storedTracks
      });
    }

    databaseReleases = [...databaseReleases.filter((item) => item.id !== release.id), release];
    saveRouteScrollPosition(renderedRouteKey || currentRouteKey());
    history.pushState({}, "", "/");
    window.location.hash = `/album/${release.id}`;
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : "Could not save release";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function cleanLocalTrackTitle(fileName, releaseTitle, kind, index) {
  if (kind === "Single" || kind === "Unreleased") {
    return index === 0 ? releaseTitle : `${releaseTitle} ${index + 1}`;
  }
  return String(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/^\s*\d+\s*[-_.]?\s*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || `Track ${index + 1}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function loadDatabaseReleases() {
  databaseReleases = Array.isArray(uploadedReleases) ? uploadedReleases : [];
  if ("indexedDB" in window) {
    const storedReleases = await loadReleasesFromDevice();
    databaseReleases = [...databaseReleases, ...storedReleases];
  }
  render();
}

const deviceDbName = "archive-device-library";
const deviceStoreName = "releases";

function openDeviceDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(deviceDbName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(deviceStoreName)) {
        database.createObjectStore(deviceStoreName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Local storage is unavailable"));
  });
}

async function saveReleaseOnDevice(release) {
  const database = await openDeviceDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(deviceStoreName, "readwrite");
    transaction.objectStore(deviceStoreName).put(release);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Could not save on this device"));
  });
  database.close();
}

async function loadReleasesFromDevice() {
  if (!("indexedDB" in window)) return [];
  const database = await openDeviceDatabase();
  const stored = await new Promise((resolve, reject) => {
    const request = database.transaction(deviceStoreName, "readonly").objectStore(deviceStoreName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("Could not read device library"));
  });
  database.close();

  return stored.map((release) => ({
    id: release.id,
    title: release.title,
    kind: release.kind,
    releaseYear: release.releaseYear,
    releaseDate: release.releaseDate,
    cover: release.coverFile ? URL.createObjectURL(release.coverFile) : defaultCover,
    accent: release.accent || "#f7f7f2",
    artist: release.artist || "",
    primaryArtist: release.primaryArtist || release.artist || "",
    tracks: release.tracks.length
      ? release.tracks.map((track) => ({
          number: track.number,
          title: track.title,
          artist: track.artist || release.artist || "",
          primaryArtist: track.primaryArtist || track.artist || release.primaryArtist || release.artist || "",
          src: URL.createObjectURL(track.file)
        }))
      : [{ number: 1, title: "No audio files", locked: true }]
  }));
}

function clearCountdown() {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdown() {
  clearCountdown();
  const panel = app.querySelector("[data-countdown-target]");
  if (!panel) return;

  const target = new Date(panel.dataset.countdownTarget).getTime();
  const output = panel.querySelector("[data-countdown-output]");
  const tick = () => {
    output.innerHTML = countdownContent(target);
  };
  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function countdownContent(target) {
  const distance = target - Date.now();
  if (distance <= 0) return `<strong class="available">Available now</strong>`;

  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);

  return [timeUnit(days, "Days"), timeUnit(hours, "Hours"), timeUnit(minutes, "Min"), timeUnit(seconds, "Sec")].join("");
}

function timeUnit(value, label) {
  return `
    <span>
      <strong>${String(value).padStart(2, "0")}</strong>
      <small>${label}</small>
    </span>
  `;
}

function getProgressValue() {
  if (!playback.duration) return 0;
  return Math.min(1000, Math.max(0, Math.round((playback.time / playback.duration) * 1000)));
}

function syncPlayerTime() {
  const time = playerRoot.querySelector("[data-player-time]");
  const duration = playerRoot.querySelector("[data-player-duration]");
  const range = playerRoot.querySelector("[data-player-progress]");
  if (time) time.textContent = formatTime(playback.time);
  if (duration) duration.textContent = formatTime(playback.duration);
  if (range && !seekGesture.active && document.activeElement !== range) {
    range.value = String(getProgressValue());
  }
}

function formatTime(value) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function render() {
  const nextRouteKey = currentRouteKey();
  const routeChanged = nextRouteKey !== renderedRouteKey;
  const routeVideoSlug = isVideosRoute() ? getRouteVideoSlug() : "";

  if (isAddRoute()) renderAddPage();
  else if (isVideosRoute()) renderVideosPage();
  else if (isPlaylistsRoute()) renderPlaylistsPage();
  else if (isAlbumRoute()) {
    const routeAlbum = getRouteAlbum();
    routeAlbum ? renderAlbum(routeAlbum) : renderNotFound();
  } else renderLibrary();

  renderPlayer();
  updateTrackStates();
  updateMediaSession();

  if (routeChanged) {
    renderedRouteKey = nextRouteKey;
    if (!restoreRouteScrollPosition(nextRouteKey)) {
      if (routeVideoSlug) scrollVideoIntoView(routeVideoSlug);
      else scrollPageToTop();
    }
  }
}

/* Capture route-link navigation before the hash/path changes so the exact
   current position is available when any page is revisited. This also covers
   album cards, menu links, player-cover links, video links and back links. */
document.addEventListener(
  "click",
  (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!isInternalRouteLink(link)) return;
    saveRouteScrollPosition(renderedRouteKey || currentRouteKey());
  },
  true
);

app.addEventListener("click", (event) => {
  const installButton = event.target.closest("[data-install-app]");
  if (installButton) {
    state.menuOpen = false;
    void requestAppInstall();
    return;
  }

  const menuToggle = event.target.closest("[data-menu-toggle]");
  if (menuToggle) {
    state.menuOpen = !state.menuOpen;
    renderLibrary();
    updateTrackStates();
    return;
  }

  const menuLink = event.target.closest("[data-menu-link]");
  if (menuLink) {
    state.menuOpen = false;
    return;
  }

  const homeLink = event.target.closest("[data-home-link]");
  if (homeLink) {
    event.preventDefault();
    state.menuOpen = false;
    history.pushState({}, "", "/");
    render();
    return;
  }

  const playButtonElement = event.target.closest("[data-play-track]");
  if (playButtonElement) {
    const track = trackLookup.get(playButtonElement.dataset.playTrack);
    if (track) playTrack(track);
    return;
  }

  const playAlbumButton = event.target.closest("[data-play-album]");
  if (playAlbumButton) {
    const album = getAlbum(playAlbumButton.dataset.playAlbum);
    if (album) playAlbum(album);
    return;
  }

  const randomizeAlbumButton = event.target.closest("[data-randomize-album]");
  if (randomizeAlbumButton) {
    const album = getAlbum(randomizeAlbumButton.dataset.randomizeAlbum);
    if (album) playAlbum(album, { randomize: true });
    return;
  }

  const queueAlbumButton = event.target.closest("[data-queue-album]");
  if (queueAlbumButton) {
    const album = getAlbum(queueAlbumButton.dataset.queueAlbum);
    if (album) addAlbumToQueue(album);
    return;
  }

  const queueButtonElement = event.target.closest("[data-queue-track]");
  if (queueButtonElement) {
    const track = trackLookup.get(queueButtonElement.dataset.queueTrack);
    if (track) addToQueue(track);
    return;
  }

  const favoriteButtonElement = event.target.closest("[data-favorite-track]");
  if (favoriteButtonElement) {
    const track = trackLookup.get(favoriteButtonElement.dataset.favoriteTrack);
    if (track) toggleFavoriteTrack(track);
    return;
  }

  const playlistTrackButton = event.target.closest("[data-playlist-track]");
  if (playlistTrackButton) {
    const track = trackLookup.get(playlistTrackButton.dataset.playlistTrack);
    if (track) openPlaylistPicker(track);
    return;
  }

  const playCurrentViewButton = event.target.closest("[data-play-current-view]");
  if (playCurrentViewButton) {
    playReleases(playbackReleasesForCurrentView());
    return;
  }

  const randomizeCurrentViewButton = event.target.closest("[data-randomize-current-view]");
  if (randomizeCurrentViewButton) {
    playReleases(playbackReleasesForCurrentView(), { randomize: true });
    return;
  }

  const toggleUnreleasedPlaybackButton = event.target.closest("[data-toggle-unreleased-playback]");
  if (toggleUnreleasedPlaybackButton) {
    state.includeUnreleasedInAllPlayback = !state.includeUnreleasedInAllPlayback;
    renderLibrary();
    updateTrackStates();
    return;
  }

  const createPlaylistButton = event.target.closest("[data-create-playlist]");
  if (createPlaylistButton) {
    const input = app.querySelector("[data-playlist-title]");
    createPlaylist(input?.value || "New Playlist");
    if (input) input.value = "";
    render();
    updateTrackStates();
    return;
  }

  const openFavoritesButton = event.target.closest("[data-open-favorites]");
  if (openFavoritesButton) {
    state.playlistPageMode = "favorites";
    render();
    updateTrackStates();
    return;
  }

  const openPlaylistButton = event.target.closest("[data-open-playlist]");
  if (openPlaylistButton) {
    const playlist = playlists.find((item) => item.id === openPlaylistButton.dataset.openPlaylist);
    if (playlist) {
      activePlaylistId = playlist.id;
      state.playlistPageMode = "playlist";
      savePlaylists();
      render();
      updateTrackStates();
    }
    return;
  }

  const playFavoriteButton = event.target.closest("[data-play-favorite-index]");
  if (playFavoriteButton) {
    playFavoriteItem(Number(playFavoriteButton.dataset.playFavoriteIndex));
    return;
  }

  if (event.target.closest("[data-play-favorites]")) {
    playFavorites();
    return;
  }

  if (event.target.closest("[data-randomize-favorites]")) {
    playFavorites({ randomize: true });
    return;
  }

  const playPlaylistButton = event.target.closest("[data-play-playlist]");
  if (playPlaylistButton) {
    playPlaylist(playPlaylistButton.dataset.playPlaylist);
    return;
  }

  const randomizePlaylistButton = event.target.closest("[data-randomize-playlist]");
  if (randomizePlaylistButton) {
    playPlaylist(randomizePlaylistButton.dataset.randomizePlaylist, { randomize: true });
    return;
  }

  const deletePlaylistButton = event.target.closest("[data-delete-playlist]");
  if (deletePlaylistButton) {
    deletePlaylist(deletePlaylistButton.dataset.deletePlaylist);
    return;
  }

  const removePlaylistTrackButton = event.target.closest("[data-remove-playlist-track]");
  if (removePlaylistTrackButton) {
    removePlaylistTrack(
      removePlaylistTrackButton.dataset.removePlaylistTrack,
      Number(removePlaylistTrackButton.dataset.playlistTrackIndex)
    );
    return;
  }

  const playPlaylistTrackButton = event.target.closest("[data-play-playlist-track]");
  if (playPlaylistTrackButton) {
    playPlaylistItem(
      playPlaylistTrackButton.dataset.playPlaylistTrack,
      Number(playPlaylistTrackButton.dataset.playlistTrackIndex)
    );
    return;
  }

  const filter = event.target.closest("[data-filter]");
  if (!filter) return;
  state.menuOpen = false;
  state.filter = filter.dataset.filter;
  renderLibrary();
  updateTrackStates();
});

document.addEventListener("click", (event) => {
  const explicitClose = event.target.closest("[data-close-playlist-picker]");
  const backdropClick = event.target.matches(".playlist-picker-backdrop");

  if (backdropClick) {
    closePlaylistPicker();
    return;
  }

  if (explicitClose && !explicitClose.classList.contains("playlist-picker-backdrop")) {
    closePlaylistPicker();
    return;
  }

  const playlistOption = event.target.closest("[data-add-to-playlist]");
  if (!playlistOption) return;

  const track = trackLookup.get(state.playlistPickerTrackKey);
  if (track) {
    toggleTrackInPlaylist(track, playlistOption.dataset.addToPlaylist);
    renderPlaylistPicker();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "search") {
    const cursor = event.target.selectionStart;
    state.query = event.target.value;
    renderLibrary();
    const input = app.querySelector("#search");
    input?.focus();
    input?.setSelectionRange(cursor, cursor);
    updateTrackStates();
    return;
  }

  if (event.target.closest("[data-add-form]")) updateUploadPreview();
});

app.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches?.("[data-playlist-title]")) {
    event.preventDefault();
    const value = event.target.value;
    createPlaylist(value || "New Playlist");
    event.target.value = "";
    render();
    updateTrackStates();
  }
});

app.addEventListener("change", (event) => {
  const yearFilter = event.target.closest("[data-year-filter]");
  if (yearFilter) {
    const year = String(yearFilter.dataset.yearFilter || "");
    const years = new Set(state.yearFilters);
    if (yearFilter.checked) years.add(year);
    else years.delete(year);
    state.yearFilters = [...years].filter((value) => /^\d{4}$/.test(value)).sort((a, b) => Number(b) - Number(a));
    localStorage.setItem(yearFilterStorageKey, JSON.stringify(state.yearFilters));
    renderLibrary();
    updateTrackStates();
    return;
  }

  const sortMode = event.target.closest("[data-sort-mode]");
  if (sortMode) {
    state.sortMode = sortMode.value;
    localStorage.setItem(sortModeStorageKey, state.sortMode);
    renderLibrary();
    updateTrackStates();
    return;
  }

  const activePlaylist = event.target.closest("[data-active-playlist]");
  if (activePlaylist) {
    activePlaylistId = activePlaylist.value;
    savePlaylists();
    render();
    updateTrackStates();
  }
});

app.addEventListener(
  "play",
  (event) => {
    const activeVideo = event.target.closest?.(".video-frame video");
    if (!activeVideo) return;

    app.querySelectorAll(".video-frame video").forEach((video) => {
      if (video !== activeVideo && !video.paused) {
        video.pause();
      }
    });
  },
  true
);

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-form]");
  if (!form) return;
  event.preventDefault();
  void submitUpload(form);
});

document.addEventListener("focusin", (event) => {
  const editable = event.target.matches?.("input, textarea, select, [contenteditable='true']");
  const mobileKeyboardSurface =
    window.innerWidth <= 820 ||
    Boolean(window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches);
  if (!editable || !playback.queueOpen || !mobileKeyboardSurface) return;

  playback.queueOpen = false;
  renderPlayerWithTransition();
});

playerRoot.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-player-expand]");
  if (!handle || event.pointerType === "mouse") return;

  event.preventDefault();

  playerDragGesture.active = true;
  playerDragGesture.pointerId = event.pointerId;
  playerDragGesture.startX = event.clientX;
  playerDragGesture.startY = event.clientY;
  playerRoot.classList.add("is-player-dragging");
  try {
    handle.setPointerCapture?.(event.pointerId);
  } catch {
    // Some synthetic or interrupted mobile pointer events do not allow capture.
  }
});

playerRoot.addEventListener("dragstart", (event) => {
  if (event.target.closest?.("[data-player-expand]")) event.preventDefault();
});

playerRoot.addEventListener("pointerup", finishPlayerDragGesture);
playerRoot.addEventListener("pointercancel", finishPlayerDragGesture);

function updateSeekPreview(slider) {
  if (!slider || !playback.duration) return;
  seekGesture.targetTime = (Number(slider.value) / 1000) * playback.duration;
  playback.time = seekGesture.targetTime;
  syncPlayerTime();
}

function updateSeekFromPointer(event) {
  if (!seekGesture.active || !seekGesture.slider) return;
  if (event?.pointerId != null && seekGesture.pointerId != null && event.pointerId !== seekGesture.pointerId) return;

  const rect = seekGesture.slider.getBoundingClientRect();
  if (rect.width <= 0) return;
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  seekGesture.slider.value = String(Math.round(ratio * 1000));
  updateSeekPreview(seekGesture.slider);
}

function beginSeekGesture(event) {
  const slider = event.target.closest?.("[data-player-progress]");
  if (!slider || !playback.current || !playback.duration || seekGesture.active) return;

  seekGesture.active = true;
  seekGesture.pointerId = event.pointerId ?? null;
  seekGesture.wasPlaying = playback.isPlaying;
  seekGesture.targetTime = playback.time;
  seekGesture.slider = slider;
  seekGesture.pausePromise = Promise.resolve();

  try {
    slider.setPointerCapture?.(event.pointerId);
  } catch {
    // Pointer capture is not available for every synthetic WebView event.
  }

  updateSeekFromPointer(event);

  if (seekGesture.wasPlaying) {
    playback.isPlaying = false;
    if (isNativePlaybackAvailable()) {
      const archiveMedia = getArchiveMediaPlugin();
      if (archiveMedia && typeof archiveMedia.pause === "function") {
        seekGesture.pausePromise = archiveMedia.pause().catch(() => {});
      }
    } else {
      playback.audio.pause();
    }
  }
}

async function finishSeekGesture(event) {
  if (!seekGesture.active) return;
  if (event?.pointerId != null && seekGesture.pointerId != null && event.pointerId !== seekGesture.pointerId) return;

  const shouldResume = seekGesture.wasPlaying;
  const targetTime = seekGesture.targetTime;
  const pausePromise = seekGesture.pausePromise;
  seekGesture.active = false;
  seekGesture.pointerId = null;
  seekGesture.wasPlaying = false;
  seekGesture.slider = null;

  playback.time = targetTime;
  if (isNativePlaybackAvailable()) {
    await pausePromise;
    await nativeSeek(targetTime, shouldResume);
    playback.isPlaying = shouldResume;
    if (shouldResume) startNativeStateTimer();
    renderPlayer();
    updateTrackStates();
  } else {
    playback.audio.currentTime = targetTime;
    if (shouldResume) startAudio();
    else renderPlayer();
  }

  syncPlayerTime();
  updateMediaSession();
  persistPlaybackState();
}

playerRoot.addEventListener("pointerdown", beginSeekGesture);
window.addEventListener("pointermove", updateSeekFromPointer);
window.addEventListener("pointerup", finishSeekGesture);
window.addEventListener("pointercancel", finishSeekGesture);

playerRoot.addEventListener("click", (event) => {
  if (event.target.closest("[data-player-expand]")) {
    if (suppressNextPlayerExpandClick) {
      event.preventDefault();
      return;
    }
    toggleQueuePanel();
    return;
  }

  const playQueueButton = event.target.closest("[data-play-queue-index]");
  if (playQueueButton) {
    playQueueItem(Number(playQueueButton.dataset.playQueueIndex));
    return;
  }

  const playFavoriteButton = event.target.closest("[data-play-favorite-index]");
  if (playFavoriteButton) {
    playFavoriteItem(Number(playFavoriteButton.dataset.playFavoriteIndex));
    return;
  }

  if (event.target.closest("[data-player-favorite]")) {
    if (playback.current) toggleFavoriteTrack(playback.current);
    renderPlayer();
    updateTrackStates();
    return;
  }

  if (event.target.closest("[data-player-playlist]")) {
    if (playback.current) openPlaylistPicker(playback.current);
    return;
  }

  const favoriteButtonElement = event.target.closest("[data-favorite-track]");
  if (favoriteButtonElement) {
    const track = trackLookup.get(favoriteButtonElement.dataset.favoriteTrack);
    if (track) toggleFavoriteTrack(track);
    renderPlayer();
    updateTrackStates();
    return;
  }

  if (event.target.closest("[data-play-favorites]")) {
    playFavorites();
    return;
  }

  const moveQueueButton = event.target.closest("[data-move-queue-index]");
  if (moveQueueButton) {
    moveQueueItem(Number(moveQueueButton.dataset.moveQueueIndex), Number(moveQueueButton.dataset.queueDirection));
    return;
  }

  const removeQueueButton = event.target.closest("[data-remove-queue-index]");
  if (removeQueueButton) {
    removeQueueItem(Number(removeQueueButton.dataset.removeQueueIndex));
    return;
  }

  if (event.target.closest("[data-player-prev]")) {
    playPrevious();
    return;
  }

  if (event.target.closest("[data-player-toggle]")) {
    if (!playback.current) {
      playAllWithUnreleasedRandomized();
      return;
    }
    if (isNativePlaybackAvailable()) {
      if (playback.isPlaying) void nativePause();
      else void nativePlayFromShownTime();
      return;
    }
    if (playback.audio.paused) startAudio();
    else playback.audio.pause();
    return;
  }

  if (event.target.closest("[data-player-next]")) {
    playNext();
    return;
  }

  if (event.target.closest("[data-player-shuffle]")) {
    shuffleCurrentQueue();
    return;
  }

  if (event.target.closest("[data-player-repeat]")) {
    cycleRepeatMode();
    return;
  }

  if (event.target.closest("[data-clear-queue]")) {
    playback.queue = [];
    syncRepeatQueueWithEditedQueue();
    renderPlayer();
    updateTrackStates();
    void nativeSyncQueueOnly();
  }
});

playerRoot.addEventListener("input", (event) => {
  if (event.target.matches("[data-player-volume]")) {
    playback.volume = Number(event.target.value) / 100;
    playback.audio.volume = playback.volume;
    void nativeSetVolume(playback.volume);
    persistPlaybackState();
    return;
  }

  if (!event.target.matches("[data-player-progress]") || !playback.duration) return;
  updateSeekPreview(event.target);

  if (!seekGesture.active) {
    const targetTime = playback.time;
    if (isNativePlaybackAvailable()) void nativeSeek(targetTime);
    else playback.audio.currentTime = targetTime;
    updateMediaSession();
    persistPlaybackState();
  }
});

playback.audio.addEventListener("loadedmetadata", () => {
  if (isNativePlaybackAvailable()) return;
  const realDuration = playback.audio.duration || 0;
  const endAt = Number(playback.current?.endAt);

  playback.duration =
    Number.isFinite(endAt) && endAt > 0
      ? Math.min(endAt, realDuration || endAt)
      : realDuration;

  applyPendingHtmlAudioSeek();
  renderPlayer();
  updateTrackStates();
  updateMediaSession(true);
  void updateNativeMediaNotification(true);
});

playback.audio.addEventListener("timeupdate", () => {
  if (isNativePlaybackAvailable()) return;
  playback.time = playback.audio.currentTime || 0;

  const endAt = Number(playback.current?.endAt);

  if (Number.isFinite(endAt) && playback.time >= endAt) {
    handleTrackEnded();
    return;
  }

  syncPlayerTime();
  updateMediaSession();
});

playback.audio.addEventListener("play", () => {
  if (isNativePlaybackAvailable()) return;
  playback.isPlaying = true;
  renderPlayer();
  updateTrackStates();
  updateMediaSession(true);
  void updateNativeMediaNotification(true);
});

playback.audio.addEventListener("pause", () => {
  if (isNativePlaybackAvailable()) return;
  if (seekGesture.active) return;
  if (playback.ignorePause) return;
  playback.isPlaying = false;
  renderPlayer();
  updateTrackStates();
  updateMediaSession();
});

playback.audio.addEventListener("ended", handleTrackEnded);

window.addEventListener("visibilitychange", () => {
  if (playback.current && playback.isPlaying) {
    updateMediaSession(true);
    void updateNativeMediaNotification(true);
  }
});

window.addEventListener("pagehide", () => {
  if (playback.current && playback.isPlaying) {
    void updateNativeMediaNotification(true);
  }
});


/* Keep the page fixed when a touch starts in the empty space beside or below
   the floating player. This extends the player's no-page-scroll zone to the
   full viewport width from the player's top edge down, without intercepting
   touches that start inside the player itself. */
let blockOutsidePlayerBandScroll = false;

function isTouchBesideOrBelowPlayer(touch, target) {
  const bar = playerRoot.querySelector(".player-bar");
  if (!bar || !touch) return false;
  if (target instanceof Node && playerRoot.contains(target)) return false;

  const rect = bar.getBoundingClientRect();
  const x = touch.clientX;
  const y = touch.clientY;

  if (y < rect.top) return false;

  const besidePlayer = y <= rect.bottom && (x < rect.left || x > rect.right);
  const belowPlayer = y > rect.bottom;
  return besidePlayer || belowPlayer;
}

document.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    blockOutsidePlayerBandScroll = isTouchBesideOrBelowPlayer(touch, event.target);
  },
  { passive: true, capture: true }
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (!blockOutsidePlayerBandScroll) return;
    event.preventDefault();
  },
  { passive: false, capture: true }
);

const clearOutsidePlayerBandScroll = () => {
  blockOutsidePlayerBandScroll = false;
};

document.addEventListener("touchend", clearOutsidePlayerBandScroll, { passive: true, capture: true });
document.addEventListener("touchcancel", clearOutsidePlayerBandScroll, { passive: true, capture: true });

/* Restore the player's own no-page-scroll behavior without removing the
   existing left/right/below-player scroll guard above. Queue scrolling and
   native range dragging remain available. */
let blockInsidePlayerScroll = false;

function shouldBlockInsidePlayerScroll(target) {
  if (!(target instanceof Element)) return false;
  if (!playerRoot.contains(target)) return false;
  if (target.closest(".queue-editor")) return false;
  if (target.closest("[data-player-progress], [data-player-volume]")) return false;
  return Boolean(target.closest(".player-bar, [data-player-expand]"));
}

playerRoot.addEventListener(
  "touchstart",
  (event) => {
    blockInsidePlayerScroll = shouldBlockInsidePlayerScroll(event.target);
  },
  { passive: true, capture: true }
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (!blockInsidePlayerScroll) return;
    event.preventDefault();
  },
  { passive: false, capture: true }
);

const clearInsidePlayerScroll = () => {
  blockInsidePlayerScroll = false;
};

document.addEventListener("touchend", clearInsidePlayerScroll, { passive: true, capture: true });
document.addEventListener("touchcancel", clearInsidePlayerScroll, { passive: true, capture: true });

window.addEventListener("hashchange", render);
window.addEventListener("popstate", render);
window.addEventListener("scroll", () => {
  scheduleRouteScrollPositionSave();
  scheduleCenteredReleaseFocusUpdate();
}, { passive: true });
window.addEventListener("resize", () => {
  scheduleFitReleaseTitles();
  schedulePlayerTitleMarquee();
  scheduleCenteredReleaseFocusUpdate();
});

restorePlaybackState();
render();
if (document.fonts?.ready) {
  document.fonts.ready.then(() => scheduleFitReleaseTitles()).catch(() => {});
}
const startupDataReady = loadDatabaseReleases();
void hydrateNativePlaybackState();
void consumePendingNativeAction();
void finishStartupLoading(startupDataReady);


/* Generic PWA install helper retained from the local-music edition. */
let deferredInstallPrompt = null;

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function closeInstallGuide() {
  document.querySelector("[data-install-guide]")?.remove();
}

function showInstallGuide() {
  if (isStandaloneApp() || document.querySelector("[data-install-guide]")) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const message = isIOS
    ? "In Safari unten auf Teilen tippen und danach „Zum Home-Bildschirm“ auswählen."
    : "Öffne das Browser-Menü und wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“.";

  document.body.insertAdjacentHTML("beforeend", `
    <aside class="install-guide" data-install-guide role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
      <div class="install-guide-card">
        <img src="/assets/brand-logo.png" alt="" />
        <p class="eyebrow">Archive App</p>
        <h2 id="install-guide-title">Auf dem Handy installieren</h2>
        <p>${message}</p>
        <button class="thin-button" type="button" data-install-close>Verstanden</button>
      </div>
    </aside>
  `);
}

async function requestAppInstall() {
  if (isStandaloneApp()) return;

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  showInstallGuide();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener("appinstalled", closeInstallGuide);

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-install-close]") || event.target.matches("[data-install-guide]")) {
    closeInstallGuide();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

