/**
 * TMDB poster/backdrop lookup.
 *
 * Returns CDN URLs for cover art keyed by title + year. We hit /search/movie
 * first; if that returns nothing, we fall back to /search/tv. Lookups are
 * cached in localStorage so repeat prompts don't burn rate limit (40 req/10s).
 *
 * Why localStorage and not React state: the cache outlives a page reload, so
 * a designer reviewing the prototype across sessions doesn't pay the lookup
 * cost twice. It also means the runtime lookup only fires for *new* titles
 * Claude emits — anything in the pre-enriched catalog is already on disk.
 */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const CACHE_KEY = "tmdb-cache-v1";

export type ArtworkUrls = {
  /** 2:3 poster, 500px wide — for tiles. */
  poster: string | null;
  /** 16:9 backdrop, 1280px wide — for the Home hero billboard. */
  backdrop: string | null;
};

type CacheEntry = ArtworkUrls & { fetchedAt: number };
type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or disabled — silent fail, we just lose the cache.
  }
}

function key(title: string, year?: number) {
  return `${title.toLowerCase().trim()}|${year ?? ""}`;
}

async function searchTmdb(
  endpoint: "movie" | "tv",
  title: string,
  year?: number,
): Promise<{ poster_path: string | null; backdrop_path: string | null } | null> {
  if (!API_KEY) return null;
  const params = new URLSearchParams({
    api_key: API_KEY,
    query: title,
    include_adult: "false",
  });
  if (year) {
    // Movies use year, TV uses first_air_date_year.
    params.set(endpoint === "movie" ? "year" : "first_air_date_year", String(year));
  }
  const res = await fetch(`${BASE}/search/${endpoint}?${params}`);
  if (!res.ok) return null;
  const json = await res.json();
  const hit = json?.results?.[0];
  if (!hit) return null;
  return { poster_path: hit.poster_path ?? null, backdrop_path: hit.backdrop_path ?? null };
}

/**
 * Get poster + backdrop URLs for a title. Returns null URLs when nothing
 * matches, so callers can fall back gracefully.
 */
export async function getArtwork(title: string, year?: number): Promise<ArtworkUrls> {
  const cache = loadCache();
  const k = key(title, year);
  if (cache[k]) return { poster: cache[k].poster, backdrop: cache[k].backdrop };

  let hit = await searchTmdb("movie", title, year);
  if (!hit) hit = await searchTmdb("tv", title, year);

  const result: ArtworkUrls = {
    poster: hit?.poster_path ? `${IMG}/w500${hit.poster_path}` : null,
    backdrop: hit?.backdrop_path ? `${IMG}/w1280${hit.backdrop_path}` : null,
  };

  cache[k] = { ...result, fetchedAt: Date.now() };
  saveCache(cache);
  return result;
}

/**
 * Convenience: just the poster, for the common tile case.
 */
export async function getPosterUrl(title: string, year?: number): Promise<string | null> {
  return (await getArtwork(title, year)).poster;
}
