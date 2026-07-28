import { neon } from "@neondatabase/serverless";

const DEFAULT_COVER = "/assets/covers/asterisk.png";

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      created_at BIGINT NOT NULL
    )
  `;
  return sql;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function cleanTrackTitle(fileName: string, releaseTitle: string, kind: string, index: number) {
  if (kind === "Single" || kind === "Unreleased") {
    return index === 0 ? releaseTitle : `${releaseTitle} ${index + 1}`;
  }
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/^\s*\d+\s*[-_.]?\s*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || `Track ${index + 1}`;
}

export async function GET() {
  try {
    const sql = await ensureSchema();
    const rows = await sql`SELECT payload FROM releases ORDER BY created_at DESC`;
    return Response.json(rows.map((row) => row.payload));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load releases" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      kind?: string;
      releaseYear?: string;
      uploadCode?: string;
      coverUrl?: string;
      audio?: Array<{ name: string; url: string }>;
    };

    const title = String(body.title || "").trim();
    const kind = String(body.kind || "Single").trim();
    const releaseYear = String(body.releaseYear || new Date().getFullYear()).trim();

    if (!title) return Response.json({ error: "Title is required" }, { status: 400 });
    if (!process.env.UPLOAD_CODE || body.uploadCode !== process.env.UPLOAD_CODE) {
      return Response.json({ error: "Invalid upload code" }, { status: 401 });
    }

    const id = `${slugify(title) || "release"}-${Date.now()}`;
    const audio = Array.isArray(body.audio) ? body.audio : [];
    const tracks = audio.map((file, index) => ({
      number: index + 1,
      title: cleanTrackTitle(file.name, title, kind, index),
      src: file.url,
    }));

    if (!tracks.length) tracks.push({ number: 1, title: "No audio files", locked: true } as never);

    const release = {
      id,
      title,
      kind,
      releaseYear,
      releaseDate: releaseYear,
      cover: body.coverUrl || DEFAULT_COVER,
      accent: "#f7f7f2",
      tracks,
    };

    const sql = await ensureSchema();
    await sql`
      INSERT INTO releases (id, payload, created_at)
      VALUES (${id}, ${JSON.stringify(release)}::jsonb, ${Date.now()})
    `;

    return Response.json(release, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
