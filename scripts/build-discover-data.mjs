#!/usr/bin/env node
/**
 * build-discover-data — builds the title pool for the Discover + Tune prototype.
 *
 *   node scripts/build-discover-data.mjs            # fetch + tag + write
 *   node scripts/build-discover-data.mjs --no-tag   # fetch only (reuses cached tags)
 *
 * 1. Pulls what TMDB (JustWatch data) lists as streaming on Netflix US, by
 *    popularity: up to MOVIE_PAGES × 20 movies and TV_PAGES × 20 series.
 * 2. Fetches details per title: runtime / seasons, keywords, US rating, logo.
 * 3. Tags each title with Claude against a fixed, spoiler-safe vocabulary
 *    (what a title IS and how it FEELS, never how it turns out).
 * 4. Writes src/prototypes/channels/discover/data/titles.json.
 *
 * Network results and tags are cached in scripts/.cache so reruns are cheap
 * and resumable. Needs VITE_TMDB_API_KEY and ANTHROPIC_API_KEY in .env.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const cacheDir = path.join(here, ".cache");
const outFile = path.join(root, "src/prototypes/channels/discover/data/titles.json");
fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const TMDB = process.env.VITE_TMDB_API_KEY;
if (!TMDB) throw new Error("VITE_TMDB_API_KEY missing from .env");
// Pages are fetched until TMDB runs out; these caps and the vote floors below
// keep the pool to roughly 5,000 titles people have actually watched.
const MOVIE_PAGES = 200;
const TV_PAGES = 150;
const MOVIE_MIN_VOTES = 40;
const TV_MIN_VOTES = 15;
const TAG = !process.argv.includes("--no-tag");

const IMG = "https://image.tmdb.org/t/p/";

function readCache(name, fallback) {
  const f = path.join(cacheDir, name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback;
}
function writeCache(name, data) {
  fs.writeFileSync(path.join(cacheDir, name), JSON.stringify(data));
}

async function tmdb(p, params = {}) {
  const qs = new URLSearchParams({ api_key: TMDB, ...params });
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.themoviedb.org/3${p}?${qs}`);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`TMDB ${p} → ${res.status}`);
    return res.json();
  }
  throw new Error(`TMDB ${p} rate limited`);
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

// ---------------------------------------------------------------- 1. lists

async function list(kind, pages, minVotes) {
  const ids = [];
  for (let page = 1; page <= pages; page++) {
    const d = await tmdb(`/discover/${kind}`, {
      with_watch_providers: "8",
      watch_region: "US",
      sort_by: "popularity.desc",
      "vote_count.gte": String(minVotes),
      page: String(page),
    });
    for (const r of d.results) if (r.backdrop_path && r.overview) ids.push(r.id);
    if (page >= d.total_pages) break;
  }
  return ids;
}

// ---------------------------------------------------------------- 2. details

function usRating(kind, d) {
  if (kind === "movie") {
    const us = d.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
    return us?.release_dates?.map((x) => x.certification).find(Boolean) ?? null;
  }
  return d.content_ratings?.results?.find((r) => r.iso_3166_1 === "US")?.rating ?? null;
}

async function details(kind, id) {
  const append = kind === "movie" ? "keywords,release_dates,images,credits" : "keywords,content_ratings,images,aggregate_credits";
  const d = await tmdb(`/${kind}/${id}`, { append_to_response: append, include_image_language: "en,null" });
  const kw = (kind === "movie" ? d.keywords?.keywords : d.keywords?.results) ?? [];
  const logo = d.images?.logos?.find((l) => l.iso_639_1 === "en") ?? d.images?.logos?.[0];
  const date = kind === "movie" ? d.release_date : d.first_air_date;
  // Top-billed cast, and who made it: director for films, creators for series.
  const castList = kind === "movie" ? d.credits?.cast : d.aggregate_credits?.cast;
  const cast = (castList ?? []).slice(0, 6).map((c) => c.name);
  const makers = kind === "movie" ? (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name) : (d.created_by ?? []).map((c) => c.name);
  return {
    id: `${kind}-${id}`,
    tmdbId: id,
    kind: kind === "movie" ? "movie" : "series",
    title: kind === "movie" ? d.title : d.name,
    year: date ? Number(date.slice(0, 4)) : null,
    overview: d.overview,
    genres: (d.genres ?? []).map((g) => g.name),
    keywords: kw.slice(0, 14).map((k) => k.name),
    runtime: kind === "movie" ? d.runtime || null : null,
    seasons: kind === "movie" ? null : d.number_of_seasons ?? null,
    episodeRuntime: kind === "movie" ? null : (d.episode_run_time?.[0] ?? d.last_episode_to_air?.runtime ?? null),
    limited: kind === "movie" ? false : /miniseries|limited series/i.test(kw.map((k) => k.name).join(" ")) || d.type === "Miniseries",
    rating: usRating(kind, d),
    lang: d.original_language,
    popularity: Math.round(d.popularity * 10) / 10,
    vote: d.vote_average,
    votes: d.vote_count,
    backdrop: `${IMG}w1280${d.backdrop_path}`,
    poster: d.poster_path ? `${IMG}w500${d.poster_path}` : null,
    logo: logo ? `${IMG}w500${logo.file_path}` : null,
    cast,
    makers: [...new Set(makers)].slice(0, 3),
  };
}

// ---------------------------------------------------------------- 3. tags

const VOCAB = {
  tone: ["playful", "warm", "tense", "dark"],
  story: [
    "whodunit", "heist", "mindgames", "romance", "comingofage", "family", "survival", "crime", "war",
    "power", "supernatural", "scifi", "adventure", "sports", "music", "competition", "nature", "friendship",
  ],
  era: ["now", "past", "future"],
  real: ["true", "fiction"],
  aim: ["rich", "institutions", "none"],
  pace: ["brisk", "slow"],
  cast: ["ensemble", "lead"],
  scare: ["none", "supernatural", "dread", "realworld"],
  world: ["grounded", "otherworldly"],
};

const SYSTEM = `You tag streaming titles for a recommendation interface. Viewers use these tags to steer what they see, so every tag must be knowable from a trailer or the one-paragraph premise. NEVER encode how a story turns out: no endings, twists, deaths, who did it, who wins, or whether a romance works out. Tag the premise and the experience of watching.

Vocabulary (use exactly these codes):
- tone: playful (comic, light) | warm (gentle, heartfelt) | tense (suspense, pressure) | dark (grim, bleak, violent)
- story: 1 to 3 codes, most central first: whodunit (a mystery to solve) | heist (heists, cons, schemes, grifts) | mindgames (strategy, manipulation, battles of wits, games) | romance | comingofage | family | survival | crime (criminals, cops, the underworld) | war | power (politics, business, royalty, power struggles) | supernatural | scifi (science fiction ideas) | adventure (quests, action journeys) | sports | music | competition (contests, reality competitions) | nature (wildlife, planet) | friendship
- era: now (contemporary setting, roughly the last 30 years) | past (period setting) | future
- real: true (documentary, or based on real events/people) | fiction
- aim: rich (sends up or centres the wealthy, class) | institutions (takes on governments, companies, police, systems) | none
- pace: brisk | slow
- cast: ensemble | lead (one clear protagonist)
- scare: none | supernatural (ghosts, demons, monsters) | dread (psychological unease) | realworld (real-world horror: killers, true crime, violence)
- world: grounded | otherworldly (fantasy, sci-fi, supernatural, animated worlds)

Return one entry per input id, in the same order.`;

const TAG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["titles"],
  properties: {
    titles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "tone", "story", "era", "real", "aim", "pace", "cast", "scare", "world"],
        properties: {
          id: { type: "string" },
          tone: { type: "string", enum: VOCAB.tone },
          story: { type: "array", items: { type: "string", enum: VOCAB.story } },
          era: { type: "string", enum: VOCAB.era },
          real: { type: "string", enum: VOCAB.real },
          aim: { type: "string", enum: VOCAB.aim },
          pace: { type: "string", enum: VOCAB.pace },
          cast: { type: "string", enum: VOCAB.cast },
          scare: { type: "string", enum: VOCAB.scare },
          world: { type: "string", enum: VOCAB.world },
        },
      },
    },
  },
};

async function tagBatch(client, batch) {
  const input = batch.map((t) => ({
    id: t.id,
    title: t.title,
    year: t.year,
    kind: t.kind,
    genres: t.genres,
    keywords: t.keywords,
    premise: (t.overview ?? "").slice(0, 420),
  }));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema: TAG_SCHEMA } },
        system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify(input) }],
      });
      if (res.stop_reason === "refusal") throw new Error("refusal");
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = JSON.parse(text);
      const valid = parsed.titles.filter(
        (x) => batch.some((t) => t.id === x.id) && x.story.length >= 1 && x.story.every((s) => VOCAB.story.includes(s)),
      );
      return valid;
    } catch (err) {
      console.warn(`  batch retry ${attempt + 1}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  return [];
}

/** TMDB keywords that describe how a story turns out. */
const SPOILER_KEYWORD =
  /twist|surprise ending|ending|death of|dies|killed|murder of|reveal|secret identity|turns out|unreliable narrator|it was all a dream|fake death|betrayal|double cross|downfall|redemption|sacrifice|tragic|happy ending|reunion|revenge (?:is|was)|amnesia/i;

// ---------------------------------------------------------------- main

async function main() {
  let raw = readCache("discover-raw.json", null);
  if (!raw) {
    console.log("Listing Netflix US titles on TMDB…");
    const movieIds = await list("movie", MOVIE_PAGES, MOVIE_MIN_VOTES);
    const tvIds = await list("tv", TV_PAGES, TV_MIN_VOTES);
    console.log(`  ${movieIds.length} movies, ${tvIds.length} series. Fetching details…`);
    const jobs = [...new Set(movieIds)].map((id) => ["movie", id]).concat([...new Set(tvIds)].map((id) => ["tv", id]));
    let done = 0;
    raw = (
      await pool(jobs, 16, async ([k, id]) => {
        try {
          const d = await details(k, id);
          if (++done % 200 === 0) console.log(`  ${done}/${jobs.length}`);
          return d;
        } catch {
          return null;
        }
      })
    ).filter(Boolean);
    writeCache("discover-raw.json", raw);
  }
  console.log(`${raw.length} titles with details.`);

  const tags = readCache("discover-tags.json", {});
  if (TAG) {
    const client = new Anthropic();
    const todo = raw.filter((t) => !tags[t.id]);
    const batches = [];
    for (let i = 0; i < todo.length; i += 25) batches.push(todo.slice(i, i + 25));
    console.log(`Tagging ${todo.length} titles in ${batches.length} batches…`);
    let n = 0;
    await pool(batches, 6, async (batch) => {
      const out = await tagBatch(client, batch);
      for (const t of out) {
        const { id, ...rest } = t;
        tags[id] = rest;
      }
      writeCache("discover-tags.json", tags);
      console.log(`  batch ${++n}/${batches.length} → ${out.length}/${batch.length}`);
    });
  }

  const titles = raw
    .filter((t) => tags[t.id])
    .map((t) => {
      const { keywords, genres, popularity, vote, ...rest } = t;
      return {
        ...rest,
        popularity: Math.round(popularity),
        vote: Math.round(vote * 10) / 10,
        genres,
        // Keywords are searchable from the composer, so anything that gives away an outcome is dropped.
        keywords: keywords.filter((k) => !SPOILER_KEYWORD.test(k)).slice(0, 10),
        tags: tags[t.id],
      };
    });
  fs.writeFileSync(outFile, JSON.stringify(titles));
  console.log(`Wrote ${titles.length} titles → ${path.relative(root, outFile)} (${Math.round(fs.statSync(outFile).size / 1024)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
