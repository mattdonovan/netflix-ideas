import { catalog, type CatalogEntry } from "@/lib/catalog";
import type { DetailModalContent, DetailModalSuggestion } from "./DetailModal";

/**
 * Synthesized title metadata for the Netflix TV surface.
 *
 * The TV layout is downstream of metadata: every card needs a genre, a length,
 * an age rating, and a one-line synopsis, and the detail view needs cast,
 * director, and maturity notes on top of that. Our catalog carries only
 * title / year / kind / artwork, so everything else is derived from a hash of
 * the title — stable across renders and re-opens, and identical wherever the
 * same title appears.
 */

/**
 * Metadata for the focus row's block under the reel.
 *
 * The TV redesign's carousel only works because every title carries a genre,
 * a length, an age rating, and a one-line synopsis — the author of the
 * breakdown makes exactly this point: the layout is downstream of the
 * metadata. Our catalog carries title/year/kind and artwork, so the rest is
 * synthesized from a hash of the title (stable across renders) using the same
 * pools the detail modal draws from.
 */
export function buildRowMeta(entry: CatalogEntry | null, fallbackTitle: string) {
  const title = entry?.title ?? fallbackTitle;
  const seed = hashString(title);
  const kind = entry?.kind ?? (seed % 2 === 0 ? "tv" : "movie");
  const genres = pickFrom(SYNTH_GENRES, seed, 1);
  const length =
    kind === "game"
      ? pickFrom(SYNTH_GAME_MODES, seed, 4)
      : kind === "tv"
        ? pickFrom(SYNTH_RUNTIMES_TV, seed, 4)
        : pickFrom(SYNTH_RUNTIMES_MOVIE, seed, 4);
  const metaParts = [genres[0], entry?.year ? String(entry.year) : undefined, length].filter(
    (p): p is string => Boolean(p),
  );
  return {
    metaParts,
    rating: kind === "game" ? "10" : ageChip(pickFrom(SYNTH_RATINGS, seed, 2)),
    hasCaptions: kind !== "game",
    synopsis: pickFrom(SYNTH_DESCRIPTIONS, seed, 5),
  };
}

const SYNTH_GAME_MODES = ["Single Player", "Co-op", "Simulation", "Roguelike", "Puzzle"];

/**
 * The TV UI shows a circled minimum age rather than a US rating code. Map the
 * codes we synthesize onto that so the chip stays a circle.
 */
export function ageChip(rating: string): string {
  if (rating === "TV-MA" || rating === "R") return "18";
  if (rating === "TV-14" || rating === "PG-13") return "16";
  return "12";
}

const SYNTH_CAST = [
  "Tilda Swinton", "Oscar Isaac", "Park Hae-soo", "Florence Pugh", "Diego Luna",
  "Letitia Wright", "Ayo Edebiri", "Ben Whishaw", "Sandra Oh", "Andrew Scott",
  "Hoyeon Jung", "Jeff Bridges", "Lily Gladstone", "Steven Yeun", "Janelle Monáe",
];
const SYNTH_DIRECTORS = [
  "Celine Song", "Bong Joon-ho", "Lulu Wang", "Barry Jenkins", "Chloé Zhao",
  "Justine Triet", "Hirokazu Kore-eda", "Jonathan Glazer", "Greta Gerwig",
];
const SYNTH_GENRES = [
  ["Drama", "Character Study"],
  ["Thriller", "Mystery"],
  ["Comedy", "Drama"],
  ["Sci-Fi", "Drama"],
  ["Crime", "Drama"],
  ["Romance", "Drama"],
  ["Action", "Adventure"],
  ["International", "Drama"],
];
const SYNTH_MATURITY_NOTES = [
  ["language", "violence"],
  ["mature themes", "language"],
  ["smoking", "language"],
  ["sexual content", "language"],
  ["violence"],
  ["mature themes"],
];
const SYNTH_RATINGS = ["TV-MA", "TV-14", "R", "PG-13", "TV-MA", "TV-14"];
const SYNTH_RUNTIMES_MOVIE = ["1h 58m", "2h 04m", "2h 11m", "2h 24m", "1h 47m"];
const SYNTH_RUNTIMES_TV = ["2 Seasons", "3 Seasons", "Limited Series", "1 Season", "4 Seasons"];
const SYNTH_DESCRIPTIONS = [
  "An unsettled stretch of time gives way to a quiet reckoning — old loyalties bend, and the room everyone walks into is never quite the one they expected.",
  "Two characters, a city that knows them too well, and the slow accumulation of small choices that turn into a life. Patient, observed, and very alive.",
  "A near-future premise hides a deeply human story about what we owe each other, and what we'll do to keep the things we already have.",
  "Half-thriller, half-elegy: a setting that should be familiar turns strange a frame at a time, until the people inside it have to decide what's worth saving.",
];

// FNV-1a-ish 32-bit hash for stable per-title sampling.
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function pickFrom<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

export function sampleN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  let i = 0;
  while (out.length < n && used.size < arr.length) {
    const idx = (seed + i * 31) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
    i++;
  }
  return out;
}

/**
 * Synthesize a DetailModalContent from a catalog entry. The catalog only
 * carries title / year / kind / artwork, so cast, director, description,
 * genres, mood, and maturity are all derived from a hash of the title —
 * stable across re-opens. "More Like This" is sampled from other catalog
 * entries that have backdrop art.
 *
 * The surfacing context (which row the tile came from) is passed as loose
 * hints rather than a row object, so this stays free of any one prototype's
 * data model.
 */
export function buildDetailContent({
  entry,
  fallbackTitle,
  genreHint,
  mood,
  isNew,
  rank,
}: {
  entry: CatalogEntry | null;
  fallbackTitle: string;
  /** Leading genre chip — usually the first word of the surfacing row's title. */
  genreHint?: string;
  /** Mood words from the surfacing row. */
  mood?: string[];
  isNew?: boolean;
  rank?: number;
}): DetailModalContent {
  const title = entry?.title ?? fallbackTitle;
  const seed = hashString(title);
  const kind: "movie" | "tv" = entry?.kind === "tv" ? "tv" : entry?.kind === "movie" ? "movie" : seed % 2 === 0 ? "tv" : "movie";

  const cast = sampleN(SYNTH_CAST, 5, seed);
  const director = kind === "movie" ? pickFrom(SYNTH_DIRECTORS, seed, 3) : undefined;
  const baseGenres = pickFrom(SYNTH_GENRES, seed, 1);
  const genres = (genreHint ? [genreHint, ...baseGenres] : baseGenres).slice(0, 3);
  const moodTags = mood?.slice(0, 3) ?? baseGenres.slice(0, 2);
  const rating = pickFrom(SYNTH_RATINGS, seed, 2);
  const runtime = kind === "tv"
    ? pickFrom(SYNTH_RUNTIMES_TV, seed, 4)
    : pickFrom(SYNTH_RUNTIMES_MOVIE, seed, 4);
  const description = pickFrom(SYNTH_DESCRIPTIONS, seed, 5);
  const maturityNotes = pickFrom(SYNTH_MATURITY_NOTES, seed, 6);
  const match = 90 + (seed % 9); // 90–98

  // Suggestions: other catalog entries with backdrops, sampled stably.
  const pool = catalog.filter(
    (c) => c.title !== title && c.backdropUrl,
  );
  const picked = sampleN(pool, 6, seed + 11);
  const suggestions: DetailModalSuggestion[] = picked.map((p, i) => {
    const s = hashString(p.title);
    return {
      title: p.title,
      year: p.year,
      backdropUrl: p.backdropUrl ?? undefined,
      match: 88 + (s % 11),
      rating: pickFrom(SYNTH_RATINGS, s, 2),
      runtime: (p.kind === "tv" ? SYNTH_RUNTIMES_TV : SYNTH_RUNTIMES_MOVIE)[(s + i) % 5],
      isNew: i === 0,
      description: pickFrom(SYNTH_DESCRIPTIONS, s, 5),
    };
  });

  return {
    title,
    year: entry?.year,
    kind,
    backdropUrl: entry?.backdropUrl ?? undefined,
    posterUrl: entry?.posterUrl ?? undefined,
    logoUrl: entry?.logoUrl ?? undefined,
    match,
    rating,
    runtime,
    formats: ["HD", "AD"],
    isNew: !!isNew,
    topTenRank: rank,
    description,
    cast,
    director,
    genres,
    mood: moodTags,
    maturityNotes,
    maturityAudience: "Recommended for ages 17 and up",
    suggestions,
  };
}

export function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const k = 1 - amount;
  const dr = Math.round(r * k);
  const dg = Math.round(g * k);
  const db = Math.round(b * k);
  return `#${[dr, dg, db].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

