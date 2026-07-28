import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const preferredPort = Number(process.env.PORT || 5173);
const uploadedReleasesPath = join(root, "src", "uploadedReleases.js");
const bundledUploadedReleasesPath = join(root, "www", "src", "uploadedReleases.js");
const uploadRoot = join(root, "public", "assets", "uploads");
const bundledUploadRoot = join(root, "www", "assets", "uploads");
const publicRoot = resolve(join(root, "public"));
const defaultCover = "/assets/covers/asterisk.png";

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".mp4", "video/mp4"],
  [".svg", "image/svg+xml"],
  [".mp3", "audio/mpeg"],
  [".m4a", "audio/mp4"],
  [".wav", "audio/wav"],
  [".zip", "application/zip"]
]);

const audioExtensions = new Set([".mp3", ".m4a", ".wav"]);

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function resolveRequest(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const mapped = cleanPath.startsWith("/assets/") ||
    cleanPath.startsWith("/data/") ||
    cleanPath === "/manifest.webmanifest" ||
    cleanPath === "/sw.js"
    ? join(root, "public", cleanPath)
    : join(root, cleanPath);
  const resolved = resolve(mapped);
  return resolved.startsWith(resolve(root)) ? resolved : null;
}

async function sendFile(req, res, filePath) {
  const fileStat = await stat(filePath);
  const type = mime.get(extname(filePath).toLowerCase()) || "application/octet-stream";
  const baseHeaders = {
    "Content-Type": type,
    "Cache-Control": "no-cache",
    "Accept-Ranges": "bytes"
  };

  const range = req.headers.range;
  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : fileStat.size - 1;

    if (!match || start > end || end >= fileStat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${fileStat.size}` });
      res.end();
      return;
    }

    res.writeHead(206, {
      ...baseHeaders,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${fileStat.size}`
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    ...baseHeaders,
    "Content-Length": fileStat.size
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

async function readDatabase() {
  try {
    const source = await readFile(uploadedReleasesPath, "utf8");
    const match = source.match(/export\s+const\s+uploadedReleases\s*=\s*(\[[\s\S]*?\]);?\s*$/);
    const data = JSON.parse(match?.[1] || "[]");
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;
    return [];
  } catch {
    return [];
  }
}

async function writeDatabase(releases) {
  const moduleSource = `export const uploadedReleases = ${JSON.stringify(releases, null, 2)};\n`;
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "www", "src"), { recursive: true });
  await writeFile(uploadedReleasesPath, moduleSource);
  await writeFile(bundledUploadedReleasesPath, moduleSource);
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache"
  });
  res.end(JSON.stringify(body));
}

function readRequestBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", rejectBody);
  });
}

function parseContentDisposition(value) {
  const parsed = {};
  for (const part of value.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey || !rawValue.length) continue;
    parsed[rawKey.toLowerCase()] = rawValue.join("=").replace(/^"|"$/g, "");
  }
  return parsed;
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(delimiter);
  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }
  parts.push(buffer.subarray(start));
  return parts;
}

function trimMultipartPart(part) {
  let start = 0;
  let end = part.length;
  if (part.subarray(0, 2).equals(Buffer.from("\r\n"))) start = 2;
  if (part.subarray(end - 2, end).equals(Buffer.from("\r\n"))) end -= 2;
  if (part.subarray(end - 2, end).equals(Buffer.from("--"))) end -= 2;
  return part.subarray(start, end);
}

function parseMultipart(body, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const headerBreak = Buffer.from("\r\n\r\n");
  const rawParts = splitBuffer(body, delimiter).slice(1, -1);
  const parts = [];

  for (const rawPart of rawParts) {
    const part = trimMultipartPart(rawPart);
    const headerEnd = part.indexOf(headerBreak);
    if (headerEnd === -1) continue;

    const headers = new Map();
    const headerText = part.subarray(0, headerEnd).toString("utf8");
    for (const line of headerText.split("\r\n")) {
      const separator = line.indexOf(":");
      if (separator === -1) continue;
      headers.set(line.slice(0, separator).toLowerCase(), line.slice(separator + 1).trim());
    }

    const disposition = parseContentDisposition(headers.get("content-disposition") || "");
    parts.push({
      name: disposition.name,
      filename: disposition.filename,
      type: headers.get("content-type") || "",
      content: part.subarray(headerEnd + headerBreak.length)
    });
  }

  return parts.filter((part) => part.name);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function safeFileName(value, fallback = "file") {
  const cleaned = basename(String(value || fallback))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return cleaned || fallback;
}

function cleanTrackTitle(fileName, releaseTitle, kind, index) {
  if (kind === "Single" || kind === "Unreleased") return index === 0 ? releaseTitle : `${releaseTitle} ${index + 1}`;

  return basename(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/^\s*\d+\s*[-_.]?\s*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || `Track ${index + 1}`;
}

function publicAssetPath(filePath) {
  const resolved = resolve(filePath);
  if (!resolved.startsWith(publicRoot)) throw new Error("Upload path escaped public directory");
  return `/${resolved.slice(publicRoot.length + 1).replaceAll("\\", "/")}`;
}

async function saveUploadFile(file, releaseDir, fileName) {
  await mkdir(releaseDir, { recursive: true });
  const filePath = join(releaseDir, fileName);
  await writeFile(filePath, file.content);

  const bundledFilePath = join(bundledUploadRoot, relative(uploadRoot, filePath));
  await mkdir(dirname(bundledFilePath), { recursive: true });
  await writeFile(bundledFilePath, file.content);

  return publicAssetPath(filePath);
}

function readZipEntries(zipBuffer) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;
  for (let index = zipBuffer.length - 22; index >= Math.max(0, zipBuffer.length - 66000); index -= 1) {
    if (zipBuffer.readUInt32LE(index) === eocdSignature) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) return [];

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  let centralOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  const entries = [];

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (zipBuffer.readUInt32LE(centralOffset) !== 0x02014b50) break;

    const flags = zipBuffer.readUInt16LE(centralOffset + 8);
    const method = zipBuffer.readUInt16LE(centralOffset + 10);
    const compressedSize = zipBuffer.readUInt32LE(centralOffset + 20);
    const fileNameLength = zipBuffer.readUInt16LE(centralOffset + 28);
    const extraLength = zipBuffer.readUInt16LE(centralOffset + 30);
    const commentLength = zipBuffer.readUInt16LE(centralOffset + 32);
    const localOffset = zipBuffer.readUInt32LE(centralOffset + 42);
    const encodedName = zipBuffer.subarray(centralOffset + 46, centralOffset + 46 + fileNameLength);
    const fileName = encodedName.toString(flags & 0x800 ? "utf8" : "latin1").replaceAll("\\", "/");

    centralOffset += 46 + fileNameLength + extraLength + commentLength;

    if (fileName.endsWith("/") || !audioExtensions.has(extname(fileName).toLowerCase())) continue;
    if (zipBuffer.readUInt32LE(localOffset) !== 0x04034b50) continue;

    const localFileNameLength = zipBuffer.readUInt16LE(localOffset + 26);
    const localExtraLength = zipBuffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);
    let content = null;

    if (method === 0) content = compressed;
    if (method === 8) content = inflateRawSync(compressed);
    if (!content) continue;

    entries.push({ name: fileName.split("/").pop(), content });
  }

  return entries;
}

async function saveAudioUploads(files, releaseDir, releaseTitle, kind) {
  const tracks = [];
  let trackIndex = 0;

  for (const file of files) {
    const extension = extname(file.filename).toLowerCase();

    if (audioExtensions.has(extension)) {
      const padded = String(trackIndex + 1).padStart(2, "0");
      const fileName = `${padded}-${safeFileName(file.filename, `track-${padded}${extension}`)}`;
      const src = await saveUploadFile(file, releaseDir, fileName);
      tracks.push({
        number: trackIndex + 1,
        title: cleanTrackTitle(file.filename, releaseTitle, kind, trackIndex),
        src
      });
      trackIndex += 1;
      continue;
    }

    if (extension === ".zip") {
      const entries = readZipEntries(file.content);
      if (!entries.length) {
        tracks.push({
          number: trackIndex + 1,
          title: `ZIP archive: ${file.filename}`,
          locked: true
        });
        trackIndex += 1;
        continue;
      }

      for (const entry of entries) {
        const entryExtension = extname(entry.name).toLowerCase();
        const padded = String(trackIndex + 1).padStart(2, "0");
        const fileName = `${padded}-${safeFileName(entry.name, `track-${padded}${entryExtension}`)}`;
        const src = await saveUploadFile({ content: entry.content }, releaseDir, fileName);
        tracks.push({
          number: trackIndex + 1,
          title: cleanTrackTitle(entry.name, releaseTitle, kind, trackIndex),
          src
        });
        trackIndex += 1;
      }
    }
  }

  return tracks.length ? tracks : [{ number: 1, title: "No audio files", locked: true }];
}

async function createRelease(req, res) {
  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) {
    sendJson(res, 400, { error: "Missing multipart boundary" });
    return;
  }

  const body = await readRequestBody(req);
  const parts = parseMultipart(body, boundary);
  const fields = new Map();
  const files = [];

  for (const part of parts) {
    if (part.filename) files.push(part);
    else fields.set(part.name, part.content.toString("utf8").trim());
  }

  const title = fields.get("title") || "";
  const kind = fields.get("kind") || "Single";
  const releaseYear = fields.get("releaseYear") || String(new Date().getFullYear());
  if (!title.trim()) {
    sendJson(res, 400, { error: "Title is required" });
    return;
  }

  const id = `${slugify(title) || "release"}-${Date.now()}`;
  const releaseDir = join(uploadRoot, id);
  const coverFile = files.find((file) => file.name === "cover" && file.content.length);
  const audioFiles = files.filter((file) => file.name === "audio" && file.content.length);
  let cover = defaultCover;

  if (coverFile) {
    const defaultCoverPath = join(root, "public", defaultCover.replace(/^\//, ""));
    const defaultCoverHash = hashBuffer(await readFile(defaultCoverPath));
    if (hashBuffer(coverFile.content) !== defaultCoverHash) {
      const extension = extname(coverFile.filename).toLowerCase() || ".png";
      cover = await saveUploadFile(coverFile, releaseDir, `cover${extension}`);
    }
  }

  const tracks = await saveAudioUploads(audioFiles, releaseDir, title.trim(), kind);
  const release = {
    id,
    title: title.trim(),
    kind,
    releaseYear: String(releaseYear).trim(),
    releaseDate: String(releaseYear).trim(),
    cover,
    accent: "#f7f7f2",
    tracks
  };

  const releases = await readDatabase();
  releases.push(release);
  await writeDatabase(releases);
  sendJson(res, 201, release);
}

async function handleApi(req, res, pathname) {
  if (pathname !== "/api/releases") return false;

  if (req.method === "GET") {
    sendJson(res, 200, await readDatabase());
    return true;
  }

  if (req.method === "POST") {
    await createRelease(req, res);
    return true;
  }

  res.writeHead(405, { Allow: "GET, POST" });
  res.end("Method Not Allowed");
  return true;
}

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url || "/", "http://127.0.0.1");
    if (await handleApi(req, res, pathname)) return;

    const requested = resolveRequest(req.url || "/");
    if (!requested) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    try {
      await sendFile(req, res, requested);
    } catch {
      const body = await readFile(join(root, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      res.end(body);
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Server error");
  }
});

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`x-archive running at http://127.0.0.1:${actualPort}`);
  });
}

listen(preferredPort);
