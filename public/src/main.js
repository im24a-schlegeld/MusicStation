import { albums as bundledAlbums } from "./albums.js";
import { uploadedReleases as bundledUploadedReleases } from "./uploadedReleases.js";

// This clean copy intentionally starts without bundled music.
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
  video: svgIcon(`<path d="M5 7h10a2 2 0 0 1 2 2v1.3l3-2V16l-3-2v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm0 2v6h10V9z" fill="currentColor" />`)
});

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

  launchScreen.classList.add("is-exiting");
  launchScreen.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    launchScreen.remove();
    document.body.classList.remove("launch-active");
  }, removalDelay);
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

const defaultCover = "/assets/covers/asterisk.png";

const musicVideos = [
  { title: "Gold Medal ft International Jefe & lil Unky", youtubeId: "QrYmk0pLBWM", group: "Music Videos" },
  { title: "Yale", youtubeId: "kpuy4BEU644", group: "Music Videos" },
  { title: "High as Sh!T", youtubeId: "JyoJ4AIkY7g", group: "Music Videos" },
  { title: "Butterfly", youtubeId: "RwqtG6dMi2E", group: "Music Videos" },
  { title: "Rock N Roll", youtubeId: "yxP4pvEQVos", group: "Music Videos" },
  { title: "Change", youtubeId: "wXw2bpR5_a8", group: "Music Videos" },
  { title: "Run + Ran", youtubeId: "gfRn6IvHL0M", group: "Music Videos" },
  { title: "The End", youtubeId: "Mk1Df4VDdrI", group: "Music Videos" },
  { title: "Go", youtubeId: "lIoYAptvFVc", group: "Music Videos" },
  { title: "MDMA ft. Destroy Lonely", youtubeId: "Gbqa9n1XOes", group: "Music Videos" },
  { title: "Freestyle 2", youtubeId: "jao-W5tJkYo", group: "Music Videos" },
  { title: "Jennifer's Body", youtubeId: "CSMiPngo4uE", group: "Music Videos" },
  { title: "Fighting My Demons - Lyrical Lemonade", youtubeId: "YKkMR2l05Rs", group: "Music Videos" },
  { title: "Succubus", youtubeId: "qCUhSPcoCcU", group: "Music Videos" },
  { title: "overseas", youtubeId: "80M6sAU9DY4", group: "Music Videos" },
  { title: "delusional", youtubeId: "gpbQ4A4tQuU", group: "Music Videos" },
  { title: "Money Spread", youtubeId: "bYIODnKGNdg", group: "Music Videos" },
  { title: "Lord Of Chaos", youtubeId: "vkhsaxlCSmc", group: "Music Videos" },
  { title: "catastrophe", youtubeId: "j2g-KI9mukI", group: "Music Videos" },
  { title: "margiela", youtubeId: "Ve5jWpIu6Ic", group: "Music Videos" },
  { title: "SoFaygo - Hell Yeah ft. Ken Carson", youtubeId: "zZ6RdhGj4dI", group: "Features / nicht auf seinem Kanal" },
  { title: "070 Shake - Natural Habitat ft. Ken Carson", youtubeId: "yB5bM0WFN8o", group: "Features / nicht auf seinem Kanal" },
  { title: "Southside, Destroy Lonely - President ft. Ken Carson", youtubeId: "fkTgbsz1aUo", group: "Features / nicht auf seinem Kanal" },
  { title: "wedidit ft. Playboi Carti", youtubeId: "xHSeZUAq2-s", group: "Music Videos" }
];

const state = {
  filter: "all",
  query: "",
  includeUnreleasedInAllPlayback: false,
  sortMode: loadSortMode(),
  yearFilters: loadYearFilters(),
  menuOpen: false
};

const playback = {
  audio: new Audio(),
  current: null,
  queue: [],
  repeatQueue: [],
  repeatMode: "off",
  history: [],
  isPlaying: false,
  ignorePause: false,
  duration: 0,
  time: 0,
  pendingSeekTime: null,
  volume: 1,
  queueOpen: false
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
    album.tracks.some((track) => normalizeText(track.title).includes(query))
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

function releaseDateLabel(album, options = {}) {
  const parsed = parsedReleaseDate(album);
  if (parsed.precision === "exact") {
    const date = new Date(parsed.year, parsed.month - 1, parsed.day);
    return new Intl.DateTimeFormat("en", {
      month: options.short ? "short" : "long",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  if (parsed.precision === "year") return options.short ? String(parsed.year) : `${parsed.year} approx.`;
  return "Unknown";
}

function releaseDatePrecision(album) {
  return parsedReleaseDate(album).precision;
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
  if (trackTitle === query) return 0;
  if (trackTitle.startsWith(query)) return 1;
  if (trackTitle.includes(query)) return 2;
  if (albumTitle.startsWith(query)) return 3;
  if (albumTitle.includes(query)) return 4;
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
    cover: album.cover || defaultCover,
    accent: album.accent
  };
  trackLookup.set(expanded.key, expanded);
  return expanded;
}

function trackProjectSubtitle(track) {
  if (!track) return "";

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
  savePlaylists();
  return playlist;
}

function playlistTracks(playlist) {
  if (!playlist) return [];
  ensureTrackLookup();
  return playlist.trackKeys.map((key) => trackLookup.get(key)).filter(Boolean);
}

function addTrackToActivePlaylist(track) {
  if (!track?.key) return;

  const playlist = getActivePlaylist() || createPlaylist("New Playlist");
  if (!playlist.trackKeys.includes(track.key)) playlist.trackKeys.push(track.key);
  playlist.updatedAt = Date.now();
  savePlaylists();
  render();
  updateTrackStates();
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
      artist: "Ken Carson",
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
    artist: "Ken Carson",
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
    artist: payload.artist || "Ken Carson",
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

    const current = restoreTrackFromPayload(saved.current);
    const queue = restoreTracksFromPayload(saved.queue);
    const history = restoreTracksFromPayload(saved.history);
    const repeatQueue = restoreTracksFromPayload(saved.repeatQueue);

    if (!current && !queue.length && !history.length) return false;

    playback.current = current;
    playback.queue = queue;
    playback.history = history;
    playback.repeatQueue = repeatQueue.length ? repeatQueue : [current, ...queue].filter(Boolean);
    playback.repeatMode = ["off", "track", "queue"].includes(saved.repeatMode) ? saved.repeatMode : "off";
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
  return true;
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

  applyNativeQueueState(state);

  if (typeof state.position === "number") playback.time = state.position;
  if (typeof state.duration === "number" && state.duration > 0) playback.duration = state.duration;
  if (typeof state.isPlaying === "boolean") playback.isPlaying = state.isPlaying;
  if (typeof state.repeatMode === "string") playback.repeatMode = state.repeatMode;

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

  renderPlayer();
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
    renderPlayer();
    updateTrackStates();
    return true;
  } catch {
    return false;
  }
}

async function nativePause() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.pause !== "function") return false;

  try {
    await archiveMedia.pause();
    playback.isPlaying = false;
    renderPlayer();
    updateTrackStates();
    return true;
  } catch {
    return false;
  }
}

async function nativeResume() {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.resume !== "function") return false;

  try {
    await archiveMedia.resume();
    playback.isPlaying = true;
    startNativeStateTimer();
    renderPlayer();
    updateTrackStates();
    return true;
  } catch {
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

async function nativeSeek(position) {
  const archiveMedia = getArchiveMediaPlugin();
  if (!archiveMedia || typeof archiveMedia.seekTo !== "function") return false;

  try {
    await archiveMedia.seekTo({ position });
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
    history.pushState({}, "", "/");
    render();
    return true;
  }

  if (window.location.hash && window.location.hash !== "#/" && window.location.hash !== "#") {
    history.pushState({}, "", "/");
    render();
    return true;
  }

  return true;
}

function setupAndroidBackButton() {
  window.__kenHandleAndroidBack = handleInAppBackButton;
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
      artist: "Ken Carson",
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
    currentDistance <= closestDistance + 84;

  const nextCenteredCard = shouldKeepCurrent ? centeredReleaseCard : closestCard;
  if (nextCenteredCard === centeredReleaseCard) return;

  centeredReleaseCard?.classList.remove("is-scroll-centered");
  nextCenteredCard.classList.add("is-scroll-centered");
  centeredReleaseCard = nextCenteredCard;
}

function scheduleCenteredReleaseFocusUpdate() {
  if (centerReleaseFocusFrame) return;
  centerReleaseFocusFrame = window.requestAnimationFrame(updateCenteredReleaseCard);
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
        <a href="/add" data-menu-link>Add</a>
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

function playlistSectionMarkup() {
  const playlist = getActivePlaylist();
  const tracks = playlistTracks(playlist);

  return `
    <section class="playlist-panel" aria-label="Custom playlists">
      <div class="section-heading">
        <h2>Custom Playlists</h2>
        <span>${playlists.length} ${playlists.length === 1 ? "list" : "lists"}</span>
      </div>
      <div class="playlist-tools">
        <label class="playlist-name-field">
          <span>Title</span>
          <input data-playlist-title type="text" placeholder="New playlist" autocomplete="off" />
        </label>
        <button class="thin-button" type="button" data-create-playlist>Create</button>
        <label class="playlist-select-field">
          <span>Active</span>
          <select data-active-playlist ${playlists.length ? "" : "disabled"}>
            ${playlists.length
              ? playlists
                  .map(
                    (item) =>
                      `<option value="${escapeHtml(item.id)}" ${playlist?.id === item.id ? "selected" : ""}>${escapeHtml(item.title)}</option>`
                  )
                  .join("")
              : `<option>No playlist</option>`}
          </select>
        </label>
        <button class="thin-button" type="button" data-play-playlist="${escapeHtml(playlist?.id || "")}" ${tracks.length ? "" : "disabled"}>
          <span aria-hidden="true">${icons.play}</span>
          Play
        </button>
        <button class="thin-button" type="button" data-randomize-playlist="${escapeHtml(playlist?.id || "")}" ${tracks.length ? "" : "disabled"}>
          <span aria-hidden="true">${icons.shuffle}</span>
          Random
        </button>
        <button class="thin-button" type="button" data-delete-playlist="${escapeHtml(playlist?.id || "")}" ${playlist ? "" : "disabled"}>
          Delete
        </button>
      </div>
      <div class="playlist-track-list">
        ${playlistTrackListMarkup(playlist, tracks)}
      </div>
    </section>
  `;
}

function playlistTrackListMarkup(playlist, tracks) {
  if (!playlist) return `<div class="playlist-empty">No playlist</div>`;
  if (!tracks.length) return `<div class="playlist-empty">No tracks</div>`;

  return tracks
    .map(
      (track, index) => `
        <div class="playlist-row" data-track-key="${escapeHtml(track.key)}">
          <button class="icon-button" type="button" data-play-playlist-track="${escapeHtml(playlist.id)}" data-playlist-track-index="${index}" aria-label="Play ${escapeHtml(track.title)}" title="Play">
            <span aria-hidden="true">${icons.play}</span>
          </button>
          <img src="${escapeHtml(track.cover || defaultCover)}" alt="${escapeHtml(track.albumTitle)} cover" loading="lazy" crossorigin="anonymous" />
          <div class="playlist-row-copy">
            <strong>${escapeHtml(track.title)}</strong>
            ${trackProjectSubtitle(track) ? `<small>${escapeHtml(trackProjectSubtitle(track))}</small>` : ""}
          </div>
          <button class="icon-button" type="button" data-remove-playlist-track="${escapeHtml(playlist.id)}" data-playlist-track-index="${index}" aria-label="Remove ${escapeHtml(track.title)}" title="Remove">
            <span aria-hidden="true">${icons.remove}</span>
          </button>
        </div>
      `
    )
    .join("");
}

function albumCard(album) {
  const hasTrackCount = showReleaseTrackCount(album);

  return `
    <a class="album-card" href="${albumUrl(album)}" style="--accent: ${escapeHtml(album.accent)}">
      ${coverMarkup(album, "album-art")}
      <span class="shine"></span>
      <div class="card-copy">
        <div class="card-meta">
          <span class="badge">${escapeHtml(releaseKindLabel(album.kind))}</span>
          ${album.releaseYear ? `<span class="card-year">${escapeHtml(album.releaseYear)}</span>` : ""}
        </div>
        <div class="card-track-line">${hasTrackCount ? pluralTracks(album.tracks.length) : ""}</div>
        <h2>${escapeHtml(album.title)}</h2>
      </div>
    </a>
  `;
}

function coverMarkup(album, className) {
  const cover = album.cover || defaultCover;
  return `
    <span class="${className}-frame">
      <img class="${className}" src="${escapeHtml(cover)}" alt="${escapeHtml(album.title)} cover" loading="lazy" crossorigin="anonymous" />
    </span>
  `;
}

function heroCoverMarkup(album) {
  const cover = album.cover || defaultCover;
  if (!album.animatedCover) {
    return coverMarkup(album, "hero-cover");
  }

  return `
    <span class="hero-cover-frame">
      <video class="hero-cover" autoplay loop muted playsinline poster="${escapeHtml(cover)}" aria-label="${escapeHtml(album.title)} animated cover">
        <source src="${escapeHtml(album.animatedCover)}" type="video/mp4" />
      </video>
    </span>
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
        <span>${escapeHtml(track.albumTitle)}</span>
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
          <h1>${escapeHtml(album.title)}</h1>
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
  requestAnimationFrame(fitReleaseTitle);
}

function fitReleaseTitle() {
  const title = app.querySelector(".album-page .hero-copy h1");
  if (!title) return;

  title.style.fontSize = "";

  const computed = window.getComputedStyle(title);
  const initialSize = Number.parseFloat(computed.fontSize);
  if (!Number.isFinite(initialSize) || initialSize <= 0) return;

  const minimumSize = Math.max(24, initialSize * 0.58);
  let size = initialSize;

  while (size > minimumSize && title.scrollWidth > title.clientWidth + 1) {
    size -= 1;
    title.style.fontSize = `${size}px`;
  }
}

function renderAddPage() {
  document.title = "Add Release | archive";
  clearCountdown();
  clearReleaseBackground();

  renderShell(`
    <header class="album-top">
      <a class="back-link" href="/" data-home-link>Back</a>
      <div class="album-stats">
        <span>Project data</span>
        <span>Add</span>
      </div>
    </header>

    <main class="add-page">
      <section class="add-hero">
        <p class="eyebrow">Library upload</p>
        <h1>Add Release</h1>
      </section>

      <form class="add-form" data-add-form action="/api/releases" method="post" enctype="multipart/form-data">
        <label>
          <span>Title</span>
          <input name="title" type="text" required autocomplete="off" />
        </label>

        <label>
          <span>Type</span>
          <select name="kind" required>
            <option value="Single">Single</option>
            <option value="Album">Album</option>
            <option value="EP">EP</option>
            <option value="Unreleased">Unreleased</option>
          </select>
        </label>

        <label>
          <span>Release year</span>
          <input name="releaseYear" type="number" min="1900" max="2100" value="${new Date().getFullYear()}" required />
        </label>

        <label>
          <span>Upload code</span>
          <input name="uploadCode" type="password" required autocomplete="current-password" />
        </label>

        <label>
          <span>Cover</span>
          <input name="cover" type="file" accept="image/*" />
        </label>

        <label class="wide-field">
          <span>Audio</span>
          <input name="audio" type="file" accept=".mp3,.m4a,.wav,audio/*" multiple />
        </label>

        <div class="upload-preview" data-upload-preview>No files selected</div>

        <div class="upload-status" data-upload-status aria-live="polite"></div>
        <button class="thin-button submit-upload" type="submit">Upload</button>
      </form>
    </main>
  `);
}

function renderVideosPage() {
  document.title = "Music Videos | archive";
  clearCountdown();
  clearReleaseBackground();
  const groups = ["Music Videos", "Features / nicht auf seinem Kanal"];
  const activeVideoSlug = getRouteVideoSlug();

  renderShell(`
    <header class="album-top">
      <a class="back-link" href="/" data-home-link>Back</a>
      <div class="album-stats">
        <span>${musicVideos.length} videos</span>
        <span>Ken Carson</span>
      </div>
    </header>

    <main class="videos-page">
      <section class="videos-hero">
        <p class="eyebrow">archive</p>
        <h1>Music Videos</h1>
      </section>

      ${groups.map((group) => videoGroupMarkup(group, activeVideoSlug)).join("")}
    </main>
  `);
}

function renderPlaylistsPage() {
  document.title = "Playlists | archive";
  clearCountdown();
  clearReleaseBackground();

  renderShell(`
    <header class="album-top">
      <a class="back-link" href="/" data-home-link>Back</a>
      <div class="album-stats">
        <span>${playlists.length} playlists</span>
        <span>Favorites ${favoriteKeys.size}</span>
      </div>
    </header>

    <main class="playlists-page">
      <section class="videos-hero">
        <p class="eyebrow">archive</p>
        <h1>Playlists</h1>
      </section>
      ${favoritesPanelMarkup()}
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

function videoGroupMarkup(group, activeVideoSlug = "") {
  const videos = musicVideos.filter((video) => video.group === group);
  return `
    <section class="video-section" aria-label="${escapeHtml(group)}">
      <div class="section-heading">
        <h2>${escapeHtml(group)}</h2>
        <span>${videos.length} videos</span>
      </div>
      <div class="video-grid">
        ${videos.map((video) => videoCard(video, activeVideoSlug)).join("")}
      </div>
    </section>
  `;
}

function videoCard(video, activeVideoSlug = "") {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}`;
  const slug = videoSlug(video);
  const isTargeted = slug === activeVideoSlug;
  return `
    <article class="video-card${isTargeted ? " is-targeted" : ""}" id="video-${escapeHtml(slug)}" data-video-slug="${escapeHtml(slug)}" tabindex="-1">
      <div class="video-frame">
        <iframe
          src="${escapeHtml(embedUrl)}"
          title="${escapeHtml(video.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
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
  return `
    <div class="track-row${videoAction ? " has-video-action" : ""}${isCurrent ? " is-current" : ""}${isPlaying ? " is-playing" : ""}" data-track-key="${escapeHtml(track.key)}">
      <div class="track-play-cell">
        ${playButton(track, isPlaying)}
      </div>
      <div class="${titleClass}">
        ${numberMarkup}
        <strong>${escapeHtml(track.title)}</strong>
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

function renderPlayer() {
  const current = playback.current;
  const progress = getProgressValue();
  const repeatLabel = getRepeatLabel();
  const subtitle = trackProjectSubtitle(current);
  const queueOpen = playback.queueOpen;
  document.body.classList.toggle("player-queue-open", queueOpen);
  const repeatModeText =
    playback.repeatMode === "track"
      ? "1"
      : playback.repeatMode === "queue"
        ? "Q"
        : "";

  playerRoot.innerHTML = `
    <section class="player-bar${current ? "" : " is-empty"}${queueOpen ? " queue-open" : ""}" aria-label="Now playing">
      <button
        class="player-drag-toggle"
        type="button"
        data-player-expand
        aria-label="${queueOpen ? "Close player" : "Open player"}"
        aria-expanded="${queueOpen}"
        title="${queueOpen ? "Close player" : "Open player"}"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

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
          <strong>${current ? escapeHtml(current.title) : "No song selected"}</strong>
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
          <button class="icon-button wheel-repeat repeat-button" type="button" data-player-repeat data-repeat-mode="${escapeHtml(playback.repeatMode)}" aria-label="${escapeHtml(repeatLabel)}" title="${escapeHtml(repeatLabel)}" aria-pressed="${playback.repeatMode !== "off"}">
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
  persistPlaybackState();
}

function queuePreviewMarkup(queuePreview) {
  return `
    <div class="queue-items">
      ${
        queuePreview.length
          ? queuePreview
              .map((track) => {
                const subtitle = trackProjectSubtitle(track);
                return `<span>${escapeHtml(track.title)} ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}</span>`;
              })
              .join("")
          : `<span class="queue-empty">Empty</span>`
      }
      ${playback.queue.length > queuePreview.length ? `<span class="queue-more">+${playback.queue.length - queuePreview.length} more</span>` : ""}
    </div>
  `;
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
  playerRoot.classList.add("is-player-switching");
  renderPlayer();
  window.clearTimeout(playerTransitionTimer);
  playerTransitionTimer = window.setTimeout(() => {
    playerRoot.classList.remove("is-player-switching");
  }, 180);
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
  renderPlayer();
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
  const modes = ["off", "track", "queue"];
  const currentIndex = modes.indexOf(playback.repeatMode);
  playback.repeatMode = modes[(currentIndex + 1) % modes.length];
  if (playback.repeatMode === "queue" && !playback.repeatQueue.length && playback.current) {
    setRepeatQueue([playback.current, ...playback.queue]);
  }
  renderPlayer();
  void nativeSetRepeatMode();
}

function getRepeatLabel() {
  if (playback.repeatMode === "track") return "Repeat current song";
  if (playback.repeatMode === "queue") return "Repeat queue";
  return "Repeat off";
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
  const kind = String(formData.get("kind") || "Single");
  const releaseYear = String(formData.get("releaseYear") || new Date().getFullYear());
  const uploadCode = String(formData.get("uploadCode") || "");
  const submitButton = form.querySelector("[type='submit']");
  const status = form.querySelector("[data-upload-status]");
  if (!title) return;

  if (submitButton) submitButton.disabled = true;
  if (status) status.textContent = "Saving to project database...";

  try {
    if (typeof window.archiveUploadBlob !== "function") throw new Error("Upload service is not ready");

    const releaseKey = `${slugify(title) || "release"}-${Date.now()}`;
    const coverFile = form.elements.cover.files[0];
    const audioFiles = [...form.elements.audio.files];
    let coverUrl = "";
    const audio = [];

    if (coverFile) {
      if (status) status.textContent = "Uploading cover...";
      const blob = await window.archiveUploadBlob(
        `releases/${releaseKey}/cover-${safeUploadName(coverFile.name)}`,
        coverFile,
        uploadCode
      );
      coverUrl = blob.url;
    }

    for (const [index, file] of audioFiles.entries()) {
      const label = `${index + 1}/${audioFiles.length}`;
      const blob = await window.archiveUploadBlob(
        `releases/${releaseKey}/${String(index + 1).padStart(2, "0")}-${safeUploadName(file.name)}`,
        file,
        uploadCode,
        (percentage) => {
          if (status) status.textContent = `Uploading track ${label}: ${Math.round(percentage)}%`;
        }
      );
      audio.push({ name: file.name, url: blob.url });
    }

    if (status) status.textContent = "Saving release...";
    const response = await fetch("/api/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, kind, releaseYear, uploadCode, coverUrl, audio })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Upload failed");

    databaseReleases = [...databaseReleases.filter((release) => release.id !== body.id), body];
    history.pushState({}, "", "/");
    window.location.hash = `/album/${body.id}`;
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : "Upload failed";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function safeUploadName(value) {
  return String(value || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "file";
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
  render();
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
  if (range && document.activeElement !== range) range.value = String(getProgressValue());
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
    if (routeVideoSlug) scrollVideoIntoView(routeVideoSlug);
    else scrollPageToTop();
  }
}

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
    if (track) addTrackToActivePlaylist(track);
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

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-form]");
  if (!form) return;
  event.preventDefault();
  void submitUpload(form);
});

playerRoot.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-player-expand]");
  if (!handle || event.pointerType === "mouse") return;

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

playerRoot.addEventListener("pointerup", finishPlayerDragGesture);
playerRoot.addEventListener("pointercancel", finishPlayerDragGesture);

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
    if (playback.current) addTrackToActivePlaylist(playback.current);
    renderPlayer();
    updateTrackStates();
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

  playback.time = (Number(event.target.value) / 1000) * playback.duration;

  if (isNativePlaybackAvailable()) {
    void nativeSeek(playback.time);
  } else {
    playback.audio.currentTime = playback.time;
  }

  syncPlayerTime();
  updateMediaSession();
  persistPlaybackState();
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

window.addEventListener("hashchange", render);
window.addEventListener("popstate", render);
window.addEventListener("scroll", scheduleCenteredReleaseFocusUpdate, { passive: true });
window.addEventListener("resize", () => {
  if (isAlbumRoute()) requestAnimationFrame(fitReleaseTitle);
  scheduleCenteredReleaseFocusUpdate();
});
restorePlaybackState();
render();
const startupDataReady = loadDatabaseReleases();
void hydrateNativePlaybackState();
void consumePendingNativeAction();
void finishStartupLoading(startupDataReady);

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
