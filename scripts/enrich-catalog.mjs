#!/usr/bin/env node
/**
 * Build-time catalog enrichment. Two jobs:
 *
 *   1. Curated lookup table — hit TMDB once per seed/expansion title and write
 *      poster + backdrop URLs into src/lib/catalog.ts. The Channels seed rows
 *      resolve their hand-picked exemplars against this table.
 *
 *   2. Fresh rows — pull what's *currently on Netflix US* from TMDB Discover
 *      (recent movies + recent series) and the Netflix Games lineup from RAWG,
 *      then code-generate ready-to-render Channel objects into
 *      src/prototypes/channels/freshChannels.ts.
 *
 * Usage:
 *   node scripts/enrich-catalog.mjs
 *
 * Requires in .env:
 *   VITE_TMDB_API_KEY     TMDB v3 key (movies + TV)
 *   RAWG_API_KEY          RAWG key (game metadata) — https://rawg.io/apidocs
 *   STEAMGRIDDB_API_KEY   SteamGridDB key (game title logos + hero art)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const OUT_PATH = path.join(ROOT, "src/lib/catalog.ts");
const FRESH_OUT_PATH = path.join(ROOT, "src/prototypes/channels/freshChannels.ts");

const env = await readFile(ENV_PATH, "utf8");
function readEnv(name) {
  const m = env.match(new RegExp(`^${name}=(.+)$`, "m"));
  return m?.[1]?.trim();
}

const API_KEY = readEnv("VITE_TMDB_API_KEY");
if (!API_KEY) {
  console.error("Missing VITE_TMDB_API_KEY in .env");
  process.exit(1);
}
const RAWG_KEY = readEnv("RAWG_API_KEY");
if (!RAWG_KEY) {
  console.error("Missing RAWG_API_KEY in .env (needed for the games row)");
  process.exit(1);
}
const SGDB_KEY = readEnv("STEAMGRIDDB_API_KEY");
if (!SGDB_KEY) {
  console.error("Missing STEAMGRIDDB_API_KEY in .env (needed for game title art)");
  process.exit(1);
}

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const RAWG = "https://api.rawg.io/api";
const SGDB = "https://www.steamgriddb.com/api/v2";
const SGDB_HEADERS = { headers: { Authorization: `Bearer ${SGDB_KEY}` } };
const NETFLIX_PROVIDER = "8"; // TMDB watch-provider id for Netflix
const REGION = "US";
const TODAY = new Date().toISOString().slice(0, 10);

// How many tiles to keep per fresh row.
const FRESH_COUNT = 14;
// "Recently added" = released within this window, ranked by popularity. Sorting
// by pure release-date surfaces the newest *obscure* uploads; a window + a vote
// floor + popularity sort surfaces recognizable recent titles instead.
const WINDOW_DAYS = 270;
const SINCE = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const VOTE_FLOOR = "40";

/**
 * Curated titles to enrich. Pulled from seedData.ts plus an expansion set that
 * covers adjacent moods so a designer can demo "new channel" prompts that hit
 * real artwork. This feeds the findInCatalog() lookup table.
 */
const TITLES_TO_ENRICH = [
  // Seed: warm cinematography
  { title: "Lost in Translation", year: 2003 },
  { title: "Call Me by Your Name", year: 2017 },
  { title: "The Florida Project", year: 2017 },
  { title: "Moonlight", year: 2016 },
  { title: "Past Lives", year: 2023 },
  { title: "Aftersun", year: 2022 },

  // Seed: new nostalgia
  { title: "Stranger Things", year: 2016 },
  { title: "The Wonder Years", year: 2021 },
  { title: "Yellowjackets", year: 2021 },
  { title: "Pen15", year: 2019 },
  { title: "Master of None", year: 2015 },
  { title: "Reservation Dogs", year: 2021 },

  // Seed: monster movies with soul
  { title: "The Shape of Water", year: 2017 },
  { title: "Annihilation", year: 2018 },
  { title: "Pan's Labyrinth", year: 2006 },
  { title: "Under the Skin", year: 2013 },
  { title: "Nope", year: 2022 },
  { title: "Color Out of Space", year: 2019 },

  // Expansion: prestige drama
  { title: "There Will Be Blood", year: 2007 },
  { title: "The Master", year: 2012 },
  { title: "Phantom Thread", year: 2017 },
  { title: "Drive My Car", year: 2021 },
  { title: "The Power of the Dog", year: 2021 },
  { title: "Tár", year: 2022 },
  { title: "The Banshees of Inisherin", year: 2022 },
  { title: "The Zone of Interest", year: 2023 },

  // Expansion: heist & crime
  { title: "Heat", year: 1995 },
  { title: "Drive", year: 2011 },
  { title: "Uncut Gems", year: 2019 },
  { title: "Good Time", year: 2017 },
  { title: "Sicario", year: 2015 },
  { title: "Killing Them Softly", year: 2012 },
  { title: "Widows", year: 2018 },

  // Expansion: sci-fi
  { title: "Arrival", year: 2016 },
  { title: "Ex Machina", year: 2014 },
  { title: "Her", year: 2013 },
  { title: "Blade Runner 2049", year: 2017 },
  { title: "Dune", year: 2021 },
  { title: "Dune: Part Two", year: 2024 },
  { title: "Interstellar", year: 2014 },
  { title: "Severance", year: 2022, tmdbIdOverride: 95396, kind: "tv" },

  // Expansion: comedy of unease
  { title: "The Bear", year: 2022 },
  { title: "Atlanta", year: 2016, tmdbIdOverride: 67178, kind: "tv" },
  { title: "Fleabag", year: 2016 },
  { title: "Barry", year: 2018 },
  { title: "Succession", year: 2018 },
  { title: "I Think You Should Leave", year: 2019 },

  // Expansion: animation
  { title: "Spider-Man: Across the Spider-Verse", year: 2023 },
  { title: "The Mitchells vs. the Machines", year: 2021 },
  { title: "Spirited Away", year: 2001 },
  { title: "Princess Mononoke", year: 1997 },
  { title: "Pinocchio", year: 2022 },

  // Expansion: documentary
  { title: "The Act of Killing", year: 2012 },
  { title: "Stories We Tell", year: 2012 },
  { title: "Faces Places", year: 2017 },
  { title: "Apollo 11", year: 2019 },
  { title: "Free Solo", year: 2018 },

  // Expansion: action
  { title: "Mad Max: Fury Road", year: 2015 },
  { title: "John Wick", year: 2014 },
  { title: "The Raid", year: 2011 },
  { title: "Mission: Impossible – Fallout", year: 2018 },

  // Expansion: horror with ideas
  { title: "Hereditary", year: 2018 },
  { title: "Midsommar", year: 2019 },
  { title: "Get Out", year: 2017 },
  { title: "The Witch", year: 2015 },
  { title: "It Follows", year: 2014 },

  // Expansion: indie
  { title: "Everything Everywhere All at Once", year: 2022 },
  { title: "Minari", year: 2020 },
  { title: "Lady Bird", year: 2017 },
  { title: "The Souvenir", year: 2019 },
  { title: "First Cow", year: 2019 },

  // Expansion: hangout / vibe
  { title: "Paterson", year: 2016 },
  { title: "Columbus", year: 2017 },
  { title: "Personal Shopper", year: 2016 },
  { title: "Frances Ha", year: 2012 },

  // Netflix-standard rows: Top 10 TV, Trending, Critically Acclaimed
  { title: "Wednesday", year: 2022, tmdbIdOverride: 119051, kind: "tv" },
  { title: "Bridgerton", year: 2020 },
  { title: "Squid Game", year: 2021 },
  { title: "The Crown", year: 2016 },
  { title: "Black Mirror", year: 2011, tmdbIdOverride: 42009, kind: "tv" },
  { title: "Money Heist", year: 2017 },
  { title: "Dark", year: 2017 },
  { title: "Ozark", year: 2017 },
  { title: "Mindhunter", year: 2017 },
  { title: "The Queen's Gambit", year: 2020 },
  { title: "Beef", year: 2023, tmdbIdOverride: 207468, kind: "tv" },
  { title: "Shōgun", year: 2024 },
  { title: "True Detective", year: 2014 },
  { title: "Better Call Saul", year: 2015 },
  { title: "Breaking Bad", year: 2008 },
  { title: "The Last of Us", year: 2023 },
  { title: "House of Ninjas", year: 2024 },
  { title: "Ripley", year: 2024 },
  { title: "Baby Reindeer", year: 2024 },
  { title: "The Diplomat", year: 2023 },
  { title: "3 Body Problem", year: 2024 },
  { title: "Avatar: The Last Airbender", year: 2024 },
  { title: "One Piece", year: 2023 },
  { title: "Heartstopper", year: 2022 },
  { title: "Love Is Blind", year: 2020, tmdbIdOverride: 100757, kind: "tv" },
  { title: "Selling Sunset", year: 2019 },
  { title: "Cobra Kai", year: 2018 },
  { title: "Outer Banks", year: 2020 },
  { title: "Emily in Paris", year: 2020 },
  { title: "The Witcher", year: 2019 },
  { title: "Lupin", year: 2021 },
  { title: "Berlin", year: 2023 },
  { title: "Squid Game: The Challenge", year: 2023 },

  // New on Netflix (movies, recent)
  { title: "Rebel Ridge", year: 2024 },
  { title: "Hit Man", year: 2024 },
  { title: "The Killer", year: 2023 },
  { title: "Maestro", year: 2023 },
  { title: "Glass Onion", year: 2022 },
  { title: "All Quiet on the Western Front", year: 2022 },
  { title: "Society of the Snow", year: 2023 },
  { title: "Carry-On", year: 2024 },
  { title: "Damsel", year: 2024 },
  { title: "Leave the World Behind", year: 2023 },

  // Documentaries
  { title: "Our Planet", year: 2019 },
  { title: "Wild Wild Country", year: 2018 },
  { title: "Making a Murderer", year: 2015 },
  { title: "Tiger King", year: 2020 },
  { title: "The Social Dilemma", year: 2020 },
  { title: "American Murder: The Family Next Door", year: 2020 },
  { title: "13th", year: 2016 },
  { title: "Don't F**k with Cats", year: 2019 },

  // Award winners
  { title: "Roma", year: 2018 },
  { title: "The Irishman", year: 2019 },
  { title: "Marriage Story", year: 2019 },
  { title: "The Trial of the Chicago 7", year: 2020 },
  { title: "Mank", year: 2020 },
  { title: "CODA", year: 2021 },
  { title: "Nomadland", year: 2020 },
];

/**
 * Netflix Games lineup — curated, because no public API exposes "what's on
 * Netflix Games." Each title is resolved against RAWG for cover art, release
 * year, and genre. Misses fall back to the channel tilePalette, same as a TMDB
 * artwork miss. Edit this list as the lineup changes.
 */
const NETFLIX_GAMES = [
  "Grand Theft Auto: San Andreas",
  "Grand Theft Auto: Vice City",
  "Grand Theft Auto III",
  "Hades",
  "Dead Cells",
  "Katana ZERO",
  "Monument Valley",
  "Monument Valley 2",
  "Oxenfree",
  "Spiritfarer",
  "Into the Breach",
  "Terra Nil",
  "Cozy Grove",
  "Vampire Survivors",
  "Braid",
  "The Case of the Golden Idol",
  "Storyteller",
  "Football Manager 2024",
];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function firstSentence(text, max = 78) {
  if (!text) return "";
  const s = String(text).split(/(?<=[.!?])\s/)[0].trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Curated lookup table (TMDB)
// ---------------------------------------------------------------------------

async function searchTmdb(endpoint, title, year) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    query: title,
    include_adult: "false",
  });
  if (year) params.set(endpoint === "movie" ? "year" : "first_air_date_year", String(year));
  const res = await fetch(`${BASE}/search/${endpoint}?${params}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.results?.[0] ?? null;
}

async function fetchById(endpoint, id) {
  const res = await fetch(`${BASE}/${endpoint}/${id}?api_key=${API_KEY}`);
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Title-treatment logo — the transparent PNG of a title's name art that Netflix
 * pins to the bottom-left of a landscape tile. Backdrops are clean plates with
 * no text; the logo is a separate asset. Returns null when TMDB has no English
 * logo for the title (caller falls back to a text title overlay).
 */
async function fetchLogo(kind, id) {
  if (!id) return null;
  const res = await fetch(`${BASE}/${kind}/${id}/images?api_key=${API_KEY}&include_image_language=en`);
  if (!res.ok) return null;
  const json = await res.json();
  const logos = json?.logos ?? [];
  if (!logos.length) return null;
  // Highest-voted first; prefer PNG (transparent raster) over SVG so it renders
  // identically as a plain <img> in the tile.
  const sorted = [...logos].sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
  const chosen = sorted.find((l) => l.file_path?.endsWith(".png")) ?? sorted[0];
  return chosen?.file_path ? `${IMG}/w500${chosen.file_path}` : null;
}

async function enrich({ title, year, tmdbIdOverride, kind: kindOverride }) {
  let hit = null;
  let kind = "movie";
  if (tmdbIdOverride) {
    kind = kindOverride ?? "movie";
    hit = await fetchById(kind, tmdbIdOverride);
  }
  if (!hit) {
    hit = await searchTmdb("movie", title, year);
    kind = "movie";
  }
  if (!hit) {
    hit = await searchTmdb("tv", title, year);
    kind = "tv";
  }
  if (!hit) return { title, year, kind: null, tmdbId: null, rawgId: null, posterUrl: null, backdropUrl: null };
  return {
    title,
    year,
    kind,
    tmdbId: hit.id,
    rawgId: null,
    posterUrl: hit.poster_path ? `${IMG}/w500${hit.poster_path}` : null,
    backdropUrl: hit.backdrop_path ? `${IMG}/w1280${hit.backdrop_path}` : null,
  };
}

// ---------------------------------------------------------------------------
// Fresh rows: recent movies + TV currently on Netflix US (TMDB Discover)
// ---------------------------------------------------------------------------

async function discoverRecent(kind) {
  const dateField = kind === "movie" ? "primary_release_date" : "first_air_date";
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: "en-US",
    watch_region: REGION,
    with_watch_providers: NETFLIX_PROVIDER,
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": VOTE_FLOOR,
    [`${dateField}.gte`]: SINCE,
    [`${dateField}.lte`]: TODAY,
  });
  const res = await fetch(`${BASE}/discover/${kind}?${params}`);
  if (!res.ok) {
    console.error(`  Discover ${kind} failed: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return (json?.results ?? [])
    .map((hit) => {
      const title = kind === "movie" ? hit.title : hit.name;
      const dateStr = kind === "movie" ? hit.release_date : hit.first_air_date;
      const year = dateStr ? Number(dateStr.slice(0, 4)) : undefined;
      return {
        title,
        year,
        kind,
        tmdbId: hit.id,
        rawgId: null,
        posterUrl: hit.poster_path ? `${IMG}/w500${hit.poster_path}` : null,
        backdropUrl: hit.backdrop_path ? `${IMG}/w1280${hit.backdrop_path}` : null,
        oneLine: firstSentence(hit.overview),
      };
    })
    // Need landscape art for the boxart row + a usable title.
    .filter((e) => e.title && e.backdropUrl)
    .slice(0, FRESH_COUNT);
}

// ---------------------------------------------------------------------------
// Fresh row: Netflix Games (RAWG)
// ---------------------------------------------------------------------------

/**
 * Pick the best art asset from a SteamGridDB list: drop NSFW/joke entries,
 * prefer English-language assets, then highest community score.
 */
function pickArt(items) {
  if (!items?.length) return null;
  const safe = items.filter((a) => !a.nsfw && !a.humor);
  const pool = safe.length ? safe : items;
  const sorted = [...pool].sort((a, b) => {
    const la = a.language === "en" ? 1 : 0;
    const lb = b.language === "en" ? 1 : 0;
    if (lb !== la) return lb - la;
    return (b.score ?? 0) - (a.score ?? 0);
  });
  return sorted[0]?.url ?? null;
}

/**
 * Game title-treatment logo + clean hero banner from SteamGridDB — the games
 * equivalent of TMDB's logos. RAWG carries neither (only a key-art screenshot),
 * so this is what gives games the same titled-card look as movies/TV.
 */
async function fetchGameArt(name) {
  try {
    const s = await fetch(`${SGDB}/search/autocomplete/${encodeURIComponent(name)}`, SGDB_HEADERS);
    if (!s.ok) return { logoUrl: null, heroUrl: null };
    const sj = await s.json();
    const id = sj?.data?.[0]?.id;
    if (!id) return { logoUrl: null, heroUrl: null };
    const [lj, hj] = await Promise.all([
      fetch(`${SGDB}/logos/game/${id}`, SGDB_HEADERS).then((r) => (r.ok ? r.json() : null)),
      fetch(`${SGDB}/heroes/game/${id}`, SGDB_HEADERS).then((r) => (r.ok ? r.json() : null)),
    ]);
    return { logoUrl: pickArt(lj?.data), heroUrl: pickArt(hj?.data) };
  } catch {
    return { logoUrl: null, heroUrl: null };
  }
}

async function fetchGame(name) {
  const params = new URLSearchParams({ key: RAWG_KEY, search: name, page_size: "1" });
  const res = await fetch(`${RAWG}/games?${params}`);
  if (!res.ok) return null;
  const json = await res.json();
  const hit = json?.results?.[0];
  if (!hit) return null;
  const year = hit.released ? Number(hit.released.slice(0, 4)) : undefined;
  const genres = (hit.genres ?? []).slice(0, 2).map((g) => g.name).join(", ");
  // RAWG → metadata; SteamGridDB → title logo + clean hero banner. Hero replaces
  // the RAWG screenshot as the landscape art; logo overlays it like movies/TV.
  const art = await fetchGameArt(hit.name);
  const backdrop = art.heroUrl ?? hit.background_image ?? null;
  return {
    title: hit.name,
    year,
    kind: "game",
    tmdbId: null,
    rawgId: hit.id,
    posterUrl: backdrop,
    backdropUrl: backdrop,
    logoUrl: art.logoUrl,
    oneLine: genres ? `${genres} — on Netflix Games.` : "On Netflix Games.",
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log(`Enriching ${TITLES_TO_ENRICH.length} curated titles…`);
const enriched = [];
let missCount = 0;
for (const t of TITLES_TO_ENRICH) {
  const e = await enrich(t);
  enriched.push(e);
  if (!e.posterUrl) {
    missCount++;
    console.log(`  ✗ ${t.title} (${t.year ?? "—"})`);
  }
  await sleep(100); // TMDB allows 40/10s; stay well under.
}
console.log(`  ${enriched.length - missCount}/${enriched.length} curated hits`);

console.log("Pulling recent movies on Netflix US…");
const recentMovies = await discoverRecent("movie");
console.log(`  ${recentMovies.length} movies`);

console.log("Pulling recent series on Netflix US…");
const recentTv = await discoverRecent("tv");
console.log(`  ${recentTv.length} series`);

console.log(`Resolving ${NETFLIX_GAMES.length} Netflix games via RAWG…`);
const games = [];
for (const name of NETFLIX_GAMES) {
  const g = await fetchGame(name);
  if (g) {
    games.push(g);
  } else {
    console.log(`  ✗ ${name}`);
  }
  await sleep(120);
}
const gameLogos = games.filter((g) => g.logoUrl).length;
console.log(`  ${games.length}/${NETFLIX_GAMES.length} games (${gameLogos} with title logos)`);

// --- Title-treatment logos for movie/TV entries (games keep RAWG key art) ---
console.log("Fetching title-treatment logos…");
let logoHits = 0;
for (const e of [...enriched, ...recentMovies, ...recentTv]) {
  if (!e.tmdbId || (e.kind !== "movie" && e.kind !== "tv")) continue;
  const logo = await fetchLogo(e.kind, e.tmdbId);
  if (logo) {
    e.logoUrl = logo;
    logoHits++;
  }
  await sleep(80);
}
console.log(`  ${logoHits} logos`);

// --- Build the catalog lookup table (curated + fresh, deduped by title) ---
const seen = new Set();
const catalogEntries = [];
for (const e of [...enriched, ...recentMovies, ...recentTv, ...games]) {
  const key = e.title.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  catalogEntries.push({
    title: e.title,
    year: e.year,
    kind: e.kind,
    tmdbId: e.tmdbId,
    rawgId: e.rawgId ?? null,
    posterUrl: e.posterUrl,
    backdropUrl: e.backdropUrl,
    logoUrl: e.logoUrl ?? null,
  });
}

const catalogBanner =
  "// AUTO-GENERATED by scripts/enrich-catalog.mjs. Do not edit by hand.\n" +
  "// Re-run `node scripts/enrich-catalog.mjs` to refresh.\n";

const catalogTs =
  catalogBanner +
  `\nexport type CatalogEntry = {\n` +
  `  title: string;\n` +
  `  year?: number;\n` +
  `  kind: "movie" | "tv" | "game" | null;\n` +
  `  tmdbId: number | null;\n` +
  `  rawgId?: number | null;\n` +
  `  posterUrl: string | null;\n` +
  `  backdropUrl: string | null;\n` +
  `  logoUrl?: string | null;\n` +
  `};\n\n` +
  `export const catalog: CatalogEntry[] = ${JSON.stringify(catalogEntries, null, 2)};\n\n` +
  `/**\n` +
  ` * Lookup by case-insensitive title (and optional year for disambiguation).\n` +
  ` * Returns null when the title isn't in the pre-enriched set — callers should\n` +
  ` * fall back to the runtime TMDB lookup in src/lib/tmdb.ts.\n` +
  ` */\n` +
  `export function findInCatalog(title: string, year?: number): CatalogEntry | null {\n` +
  `  const t = title.toLowerCase().trim();\n` +
  `  return (\n` +
  `    catalog.find((e) => e.title.toLowerCase() === t && (year ? e.year === year : true)) ??\n` +
  `    catalog.find((e) => e.title.toLowerCase() === t) ??\n` +
  `    null\n` +
  `  );\n` +
  `}\n`;

await writeFile(OUT_PATH, catalogTs, "utf8");
console.log(`\nWrote ${catalogEntries.length} entries → ${path.relative(ROOT, OUT_PATH)} (${missCount} curated misses)`);

// --- Build the fresh, ready-to-render channels ---
const CURRENT_YEAR = Number(TODAY.slice(0, 4));
function toExemplars(entries) {
  return entries.map((e) => ({
    title: e.title,
    year: e.year ?? CURRENT_YEAR,
    oneLine: e.oneLine || "—",
  }));
}

const freshDefs = [
  {
    id: "recently-added-movies",
    title: "Recently Added Movies",
    tags: ["new", "recent", "movies"],
    tone: ["fresh", "current", "varied"],
    moodColor: "#E50914",
    tilePalette: ["#2A2A2A", "#1F1F1F", "#3A3A3A", "#252525", "#333333"],
    entries: recentMovies,
  },
  {
    id: "just-added-series",
    title: "Just Added Series",
    tags: ["new", "recent", "series"],
    tone: ["fresh", "current", "bingeable"],
    moodColor: "#5B7CB8",
    tilePalette: ["#3D5A8C", "#5B7CB8", "#2E4670", "#456E9F", "#6889B5"],
    entries: recentTv,
  },
  {
    id: "netflix-games",
    title: "Netflix Games",
    tags: ["games", "mobile", "included"],
    tone: ["playful", "pick-up", "varied"],
    moodColor: "#A66EFF",
    tilePalette: ["#3A2A5A", "#4A2E6E", "#2E1F46", "#5B3D8C", "#241633"],
    entries: games,
  },
].filter((d) => d.entries.length);

const freshChannels = freshDefs.map((d) => ({
  id: d.id,
  category: {
    title: d.title,
    tags: d.tags,
    tone: d.tone,
    moodColor: d.moodColor,
    exemplars: toExemplars(d.entries),
  },
  tilePalette: d.tilePalette,
}));

const freshBanner =
  "// AUTO-GENERATED by scripts/enrich-catalog.mjs. Do not edit by hand.\n" +
  "// Re-run `node scripts/enrich-catalog.mjs` to refresh.\n" +
  "// Live Netflix-US rows: recent movies + series (TMDB Discover) and games (RAWG).\n";

const freshTs =
  freshBanner +
  `\nimport type { Channel } from "./seedData";\n\n` +
  `export const freshChannels: Channel[] = ${JSON.stringify(freshChannels, null, 2)};\n`;

await writeFile(FRESH_OUT_PATH, freshTs, "utf8");
console.log(
  `Wrote ${freshChannels.length} fresh channels → ${path.relative(ROOT, FRESH_OUT_PATH)} ` +
    `(${recentMovies.length} movies, ${recentTv.length} series, ${games.length} games)`,
);
