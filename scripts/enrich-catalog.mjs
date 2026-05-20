#!/usr/bin/env node
/**
 * Hit TMDB once per seed/expansion title and write the enriched poster +
 * backdrop URLs into src/lib/catalog.ts. Run this when you add new titles to
 * seedData.ts or to TITLES_TO_ENRICH below.
 *
 * Usage:
 *   node scripts/enrich-catalog.mjs
 *
 * Requires VITE_TMDB_API_KEY in .env (TMDB v3 key).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env");
const OUT_PATH = path.join(ROOT, "src/lib/catalog.ts");

const env = await readFile(ENV_PATH, "utf8");
const match = env.match(/^VITE_TMDB_API_KEY=(.+)$/m);
const API_KEY = match?.[1]?.trim();
if (!API_KEY) {
  console.error("Missing VITE_TMDB_API_KEY in .env");
  process.exit(1);
}

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

/**
 * Titles to enrich. Pulled from seedData.ts plus a curated expansion set that
 * covers adjacent moods so a designer can demo "new channel" prompts that hit
 * real artwork.
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
  if (!hit) return { title, year, posterUrl: null, backdropUrl: null, kind: null, tmdbId: null };
  return {
    title,
    year,
    kind,
    tmdbId: hit.id,
    posterUrl: hit.poster_path ? `${IMG}/w500${hit.poster_path}` : null,
    backdropUrl: hit.backdrop_path ? `${IMG}/w1280${hit.backdrop_path}` : null,
  };
}

console.log(`Enriching ${TITLES_TO_ENRICH.length} titles…`);

const enriched = [];
let missCount = 0;
for (const t of TITLES_TO_ENRICH) {
  const e = await enrich(t);
  enriched.push(e);
  if (!e.posterUrl) {
    missCount++;
    console.log(`  ✗ ${t.title} (${t.year ?? "—"})`);
  } else {
    console.log(`  ✓ ${t.title}`);
  }
  // Polite throttle — TMDB allows 40/10s, this stays well under.
  await new Promise((r) => setTimeout(r, 100));
}

const banner = `// AUTO-GENERATED by scripts/enrich-catalog.mjs. Do not edit by hand.\n// Re-run \`node scripts/enrich-catalog.mjs\` to refresh.\n`;

const ts =
  banner +
  `\nexport type CatalogEntry = {\n` +
  `  title: string;\n` +
  `  year?: number;\n` +
  `  kind: "movie" | "tv" | null;\n` +
  `  tmdbId: number | null;\n` +
  `  posterUrl: string | null;\n` +
  `  backdropUrl: string | null;\n` +
  `};\n\n` +
  `export const catalog: CatalogEntry[] = ${JSON.stringify(enriched, null, 2)};\n\n` +
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

await writeFile(OUT_PATH, ts, "utf8");
console.log(`\nWrote ${enriched.length} entries → ${path.relative(ROOT, OUT_PATH)} (${missCount} misses)`);
