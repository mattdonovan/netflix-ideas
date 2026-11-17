import raw from "./data/titles.json";

/**
 * The title pool for Discover + Tune: what TMDB lists as streaming on Netflix
 * US, tagged by Claude against a spoiler-safe vocabulary. Built by
 * `node scripts/build-discover-data.mjs`.
 *
 * Every tag describes what a title IS or how it FEELS, never how it turns out.
 */

type RawTitle = {
  id: string;
  tmdbId: number;
  kind: "movie" | "series";
  title: string;
  year: number | null;
  overview: string;
  genres: string[];
  keywords: string[];
  runtime: number | null;
  seasons: number | null;
  episodeRuntime: number | null;
  limited: boolean;
  rating: string | null;
  lang: string;
  popularity: number;
  vote: number;
  votes: number;
  backdrop: string;
  poster: string | null;
  logo: string | null;
  /** Top-billed cast and who made it (director / creators). */
  cast?: string[];
  makers?: string[];
  tags: {
    tone: string;
    story: string[];
    era: string;
    real: string;
    aim: string;
    pace: string;
    cast: string;
    scare: string;
    world: string;
  };
};

export type Dim =
  | "tone" | "story" | "aim" | "era" | "scare" | "world" | "pace" | "cast" | "real" | "lang" | "format" | "time"
  /** Open-ended, from the composer: a person in it or behind it, or a subject keyword. */
  | "person" | "keyword";

/** Dimensions whose values come from the data rather than a fixed list. */
export const OPEN_DIMS: Dim[] = ["person", "keyword"];

export type Title = RawTitle & {
  /** Single-valued dimensions, including the ones derived from metadata. */
  dims: Record<Exclude<Dim, "story" | "person" | "keyword">, string>;
};

function timeOf(t: RawTitle): string {
  if (t.kind === "movie") return (t.runtime ?? 110) <= 105 ? "quick" : "evening";
  if ((t.episodeRuntime ?? 45) <= 30 && (t.seasons ?? 1) <= 2) return "quick";
  return (t.seasons ?? 1) <= 2 || t.limited ? "few" : "long";
}

export const TITLES: Title[] = (raw as RawTitle[])
  .filter((t) => t.backdrop && t.tags?.story?.length)
  .map((t) => ({
    ...t,
    dims: {
      tone: t.tags.tone,
      aim: t.tags.aim,
      era: t.tags.era,
      scare: t.tags.scare,
      world: t.tags.world,
      pace: t.tags.pace,
      cast: t.tags.cast,
      real: t.tags.real,
      lang: t.lang === "en" ? "en" : "other",
      format: t.kind,
      time: timeOf(t),
    },
  }));

export const titleById = new Map(TITLES.map((t) => [t.id, t]));
export const titleByName = new Map(TITLES.map((t) => [t.title, t]));

export const ANY = "*";

/**
 * Grammar for the tune sentence. Each dimension is one slot; `role` decides
 * where it sits:
 *   adj   → before the noun ("playful", "slow-burn")
 *   noun  → the story itself ("heists & cons")
 *   after → a clause after the noun ("about the rich", "set today")
 *   watch → the second sentence, about how you'll watch it
 */
type DimSpec = {
  label: string;
  /** adj: before the type · type: the kind of story · noun: stories / movies / series · after: a clause after the noun. */
  role: "adj" | "type" | "noun" | "after" | "watch";
  values: Record<string, { chip: string; phrase: string }>;
  any: { chip: string; phrase: string };
  /** Plain linking word(s) in front of the value: "set" in "set in the past". Not a control. */
  lead?: string;
  /** Typed phrases that loosen this word, i.e. remove it: "anytime", "any mood". */
  loosen?: string[];
  /** Group values: one option standing for several tags. */
  groups?: Record<string, string[]>;
};

export const VOCAB: Record<Dim, DimSpec> = {
  tone: {
    label: "Mood",
    loosen: ["any mood", "whatever mood", "any vibe"],
    role: "adj",
    values: {
      playful: { chip: "Playful", phrase: "playful" },
      warm: { chip: "Warm", phrase: "warm" },
      tense: { chip: "Tense", phrase: "tense" },
      dark: { chip: "Dark", phrase: "dark" },
    },
    any: { chip: "Any mood", phrase: "any mood" },
  },
  pace: {
    label: "Pace",
    loosen: ["any pace"],
    role: "adj",
    values: { brisk: { chip: "Fast-moving", phrase: "fast-moving" }, slow: { chip: "Slow-burn", phrase: "slow-burn" } },
    any: { chip: "Any pace", phrase: "any pace" },
  },
  world: {
    label: "World",
    loosen: ["any world", "any kind of world"],
    role: "adj",
    values: { grounded: { chip: "Grounded", phrase: "grounded" }, otherworldly: { chip: "Otherworldly", phrase: "otherworldly" } },
    any: { chip: "Any world", phrase: "any kind of world" },
  },
  story: {
    label: "Kind of story",
    role: "type",
    values: {
      schemes: { chip: "Scheming", phrase: "scheming" },
      whodunit: { chip: "Mystery", phrase: "mystery" },
      heist: { chip: "Heist", phrase: "heist" },
      mindgames: { chip: "Mind-game", phrase: "mind-game" },
      romance: { chip: "Love", phrase: "love" },
      comingofage: { chip: "Coming-of-age", phrase: "coming-of-age" },
      family: { chip: "Family", phrase: "family" },
      survival: { chip: "Survival", phrase: "survival" },
      crime: { chip: "Crime", phrase: "crime" },
      war: { chip: "War", phrase: "war" },
      power: { chip: "Power-play", phrase: "power-play" },
      supernatural: { chip: "Supernatural", phrase: "supernatural" },
      scifi: { chip: "Sci-fi", phrase: "sci-fi" },
      adventure: { chip: "Adventure", phrase: "adventure" },
      sports: { chip: "Sports", phrase: "sports" },
      music: { chip: "Music", phrase: "music" },
      competition: { chip: "Competition", phrase: "competition" },
      nature: { chip: "Nature", phrase: "nature" },
      friendship: { chip: "Friendship", phrase: "friendship" },
    },
    any: { chip: "Any kind", phrase: "" },
    groups: { schemes: ["whodunit", "heist", "mindgames"] },
  },
  aim: {
    label: "About",
    lead: "about",
    loosen: ["about anyone", "about anything"],
    role: "after",
    values: {
      rich: { chip: "The rich", phrase: "about the rich" },
      institutions: { chip: "The system", phrase: "taking on the system" },
      none: { chip: "Ordinary people", phrase: "about ordinary people" },
    },
    any: { chip: "Anyone", phrase: "about anyone" },
  },
  era: {
    label: "Era",
    lead: "set",
    loosen: ["anytime", "any time", "whenever", "any era", "any period", "from any era"],
    role: "after",
    values: {
      now: { chip: "Today", phrase: "set today" },
      past: { chip: "The past", phrase: "set in the past" },
      future: { chip: "The future", phrase: "set in the future" },
    },
    any: { chip: "Any era", phrase: "from any era" },
  },
  scare: {
    label: "Scares",
    lead: "with",
    loosen: ["scary or not", "doesn't have to be scary", "don't care about scares", "any scares"],
    role: "after",
    values: {
      scary: { chip: "Scary", phrase: "with scares" },
      supernatural: { chip: "Supernatural", phrase: "with supernatural scares" },
      dread: { chip: "Creeping dread", phrase: "full of dread" },
      realworld: { chip: "Real-world", phrase: "with real-world horror" },
      none: { chip: "No scares", phrase: "with no scares" },
    },
    any: { chip: "Scary or not", phrase: "scary or not" },
    groups: { scary: ["supernatural", "dread", "realworld"] },
  },
  cast: {
    label: "Cast",
    lead: "with",
    loosen: ["any cast"],
    role: "after",
    values: { ensemble: { chip: "Big ensemble", phrase: "with a big ensemble" }, lead: { chip: "One lead", phrase: "with one lead" } },
    any: { chip: "Any cast", phrase: "with any cast" },
  },
  real: {
    label: "True or not",
    loosen: ["true or invented", "true or not", "real or not"],
    role: "after",
    values: { true: { chip: "Real events", phrase: "based on real events" }, fiction: { chip: "Made up", phrase: "made up" } },
    any: { chip: "Either", phrase: "true or invented" },
  },
  lang: {
    label: "Language",
    loosen: ["any language"],
    role: "watch",
    values: { en: { chip: "English", phrase: "in English" }, other: { chip: "Subtitled", phrase: "with subtitles" } },
    any: { chip: "Any language", phrase: "in any language" },
  },
  format: {
    label: "Stories",
    role: "noun",
    values: {
      stories: { chip: "Stories", phrase: "stories" },
      movie: { chip: "Movies", phrase: "movies" },
      series: { chip: "Series", phrase: "series" },
      limited: { chip: "Limited series", phrase: "limited series" },
      long: { chip: "Long-running series", phrase: "long-running series" },
    },
    any: { chip: "Stories", phrase: "stories" },
  },
  time: {
    label: "Time",
    loosen: ["any length", "however long"],
    role: "watch",
    values: {
      quick: { chip: "Quick", phrase: "you can finish quickly" },
      evening: { chip: "One evening", phrase: "for one evening" },
      few: { chip: "A few nights", phrase: "for a few nights" },
      long: { chip: "The long haul", phrase: "to get lost in" },
    },
    any: { chip: "Any length", phrase: "of any length" },
  },
  person: {
    label: "Starring",
    lead: "starring",
    role: "after",
    values: {},
    any: { chip: "Anyone", phrase: "with anyone" },
  },
  keyword: {
    label: "About",
    lead: "about",
    role: "after",
    values: {},
    any: { chip: "Anything", phrase: "about anything" },
  },
};

/** Does a title carry this value? Story is multi-valued; groups expand. */
export function hasValue(t: Title, dim: Dim, value: string): number {
  if (value === ANY) return 0;
  const spec = VOCAB[dim];
  const wanted = spec.groups?.[value] ?? [value];
  if (dim === "story") {
    const idx = t.tags.story.findIndex((s) => wanted.includes(s));
    return idx === -1 ? 0 : idx === 0 ? 1 : 0.7;
  }
  if (dim === "person") return t.cast?.includes(value) || t.makers?.includes(value) ? 1 : 0;
  if (dim === "format") {
    // "Stories" is both; the series lengths are series with a season shape.
    if (value === "stories") return 1;
    if (value === "limited") return t.kind === "series" && (t.limited || (t.seasons ?? 1) === 1) ? 1 : 0;
    if (value === "long") return t.kind === "series" && (t.seasons ?? 1) >= 3 ? 1 : 0;
    return t.kind === value ? 1 : 0;
  }
  if (dim === "keyword") return t.keywords.includes(value) ? 1 : 0;
  return wanted.includes(t.dims[dim]) ? 1 : 0;
}

/** Near-misses count for a little: playful is closer to warm than to dark. */
const NEAR: Partial<Record<Dim, Record<string, string[]>>> = {
  tone: { playful: ["warm"], warm: ["playful"], tense: ["dark"], dark: ["tense"] },
  time: { quick: ["evening"], evening: ["quick", "few"], few: ["evening", "long"], long: ["few"] },
};
export function nearValue(t: Title, dim: Dim, value: string): boolean {
  const near = NEAR[dim]?.[value];
  return !!near && near.includes(t.dims[dim as keyof Title["dims"]]);
}

export function chip(dim: Dim, value: string) {
  return value === ANY ? VOCAB[dim].any.chip : VOCAB[dim].values[value]?.chip ?? value;
}
/** A word split into its plain lead and the part that's a control: "set" + "in the past". */
export function wordParts(dim: Dim, value: string): { lead: string; word: string } {
  const full = phrase(dim, value);
  const lead = VOCAB[dim].lead;
  if (lead && full.toLowerCase().startsWith(`${lead} `)) return { lead, word: full.slice(lead.length + 1) };
  return { lead: "", word: full };
}

export function phrase(dim: Dim, value: string) {
  if (dim === "person") return `starring ${value}`;
  if (dim === "keyword") return `about ${value}`;
  return value === ANY ? VOCAB[dim].any.phrase : VOCAB[dim].values[value]?.phrase ?? value;
}

/** Who's in the pool, and how often: drives "starring Brad…" completion. */
export const PEOPLE: Array<{ name: string; count: number }> = (() => {
  const m = new Map<string, number>();
  for (const t of TITLES) for (const n of [...(t.cast ?? []), ...(t.makers ?? [])]) m.set(n, (m.get(n) ?? 0) + 1);
  return [...m.entries()].filter(([, c]) => c >= 2).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
})();

/** Subject keywords in the pool, and how often. */
export const KEYWORDS: Array<{ name: string; count: number }> = (() => {
  const m = new Map<string, number>();
  for (const t of TITLES) for (const k of t.keywords) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].filter(([, c]) => c >= 3).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
})();

export type Theme = {
  id: string;
  name: string;
  /** Preferred art titles; the first one in the pool and not already used in its set wins. */
  art: string[];
  /** The theme's defining words. Mood, story and format are filled in from the top picks when missing. */
  slots: Array<[Dim, string]>;
};

/**
 * Discover's carousel, three sets of eight. "Get more options" swaps in the
 * next set; ↻ on a theme in the tune view moves to the next theme in its set.
 */
export const THEME_SETS: Theme[][] = [
  [
    { id: "outsmart", name: "Outsmart Everyone", art: ["Glass Onion: A Knives Out Mystery"], slots: [["tone", "playful"], ["story", "schemes"]] },
    { id: "royal", name: "Royal Court Intrigue", art: ["The Crown", "Bridgerton"], slots: [["story", "power"], ["era", "past"], ["format", "series"]] },
    { id: "light", name: "Something Light", art: ["Emily in Paris"], slots: [["tone", "playful"], ["real", "fiction"]] },
    { id: "scare", name: "Scare Me", art: ["Stranger Things"], slots: [["scare", "scary"]] },
    { id: "quick", name: "Quick Watches", art: ["I Think You Should Leave with Tim Robinson"], slots: [["time", "quick"]] },
    { id: "rich", name: "Family Scandal Sagas", art: [], slots: [["story", "family"], ["aim", "rich"], ["format", "series"]] },
    { id: "real", name: "Stranger Than Fiction", art: [], slots: [["real", "true"]] },
    { id: "mind", name: "Mind-Bending", art: ["Dark", "3 Body Problem"], slots: [["tone", "tense"], ["world", "otherworldly"], ["story", "scifi"]] },
  ],
  [
    { id: "edge", name: "Edge of Your Seat", art: [], slots: [["tone", "tense"], ["pace", "brisk"], ["story", "crime"]] },
    { id: "love", name: "Falling for It", art: [], slots: [["story", "romance"], ["tone", "warm"]] },
    { id: "growing", name: "Growing Up", art: [], slots: [["story", "comingofage"]] },
    { id: "heists", name: "Heists & Hustles", art: [], slots: [["story", "heist"]] },
    { id: "worlds", name: "Other Worlds", art: [], slots: [["world", "otherworldly"], ["story", "adventure"]] },
    { id: "truecrime", name: "True Crime Obsessions", art: [], slots: [["real", "true"], ["story", "crime"]] },
    { id: "feelgood", name: "Feel-Good Favorites", art: [], slots: [["tone", "warm"], ["pace", "brisk"]] },
    { id: "period", name: "Lost in Another Era", art: [], slots: [["era", "past"], ["tone", "warm"]] },
  ],
  [
    { id: "survival", name: "Survival Mode", art: [], slots: [["story", "survival"]] },
    { id: "gameon", name: "Game On", art: [], slots: [["story", "competition"]] },
    { id: "slowburn", name: "Slow-Burn Mysteries", art: [], slots: [["story", "whodunit"], ["pace", "slow"]] },
    { id: "ensemble", name: "Big Messy Ensembles", art: [], slots: [["cast", "ensemble"], ["tone", "playful"]] },
    { id: "darkthrill", name: "Dark Thrillers", art: [], slots: [["tone", "dark"], ["story", "crime"], ["format", "movie"]] },
    { id: "sports", name: "Underdog Sports", art: [], slots: [["story", "sports"]] },
    { id: "future", name: "Future Shock", art: [], slots: [["era", "future"], ["world", "otherworldly"]] },
    { id: "subtitles", name: "Worth the Subtitles", art: [], slots: [["lang", "other"], ["tone", "tense"]] },
  ],
];

export const THEMES: Theme[] = THEME_SETS.flat();

/** The words shown when Discover starts from a title: what it's like. */
export function titleSlots(t: Title): Array<[Dim, string]> {
  const slots: Array<[Dim, string]> = [["tone", t.dims.tone], ["story", t.tags.story[0]]];
  if (t.dims.aim !== "none") slots.push(["aim", t.dims.aim]);
  else if (t.dims.era !== "now") slots.push(["era", t.dims.era]);
  slots.push(["format", t.dims.format]);
  return slots;
}

export function runtimeLabel(t: Title): string {
  if (t.kind === "movie" && t.runtime) return `${Math.floor(t.runtime / 60)}h ${t.runtime % 60}m`;
  if (t.seasons) return t.limited ? "Limited series" : `${t.seasons} season${t.seasons === 1 ? "" : "s"}`;
  return t.kind === "movie" ? "Movie" : "Series";
}
