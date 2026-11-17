import {
  ANY,
  OPEN_DIMS,
  THEME_SETS,
  TITLES,
  VOCAB,
  titleByName,
  hasValue,
  nearValue,
  titleSlots,
  type Dim,
  type Theme,
  type Title,
} from "./catalog";

/**
 * The tune engine: ranking, not filtering.
 *
 * Every slot is a weighted preference. Changing one re-scores the whole pool
 * (≈5,400 titles) and the page always shows the best PICKS, with a diversity
 * pass so one story type can't take over. A change re-composes the set
 * instead of whittling it down: there's always a full page.
 *
 * No model call sits on this path; a 400 ms dwell is a local re-rank.
 */

export const PICKS = 36;

export type Anchor = { kind: "theme"; theme: Theme } | { kind: "title"; title: Title };

export type Slot = {
  dim: Dim;
  value: string;
  /** The viewer set it. */
  user: boolean;
  /** Filled in from the picks rather than the anchor; counts for little until the viewer sets it. */
  inferred?: boolean;
  /** Previewing its removal: still shown (struck through), no longer ranked. */
  removed?: boolean;
  /** When the viewer last set it; the most recent word is blamed first for a conflict. */
  at?: number;
};

let clock = 0;
/** A monotonically increasing stamp for `Slot.at`. */
export const touch = () => ++clock;

export type TuneState = { slots: Slot[] };

// A named person or subject is the most specific thing a viewer can say, so it outranks mood and story.
const WEIGHT: Partial<Record<Dim, number>> = { person: 4.5, keyword: 3.5, story: 3.2, tone: 2.2, scare: 2, time: 1.8, format: 1.6, real: 2 };

function defaults(anchor: Anchor): Array<[Dim, string]> {
  return anchor.kind === "theme" ? anchor.theme.slots : titleSlots(anchor.title);
}

/** Every sentence always says something about these. */
const REQUIRED: Dim[] = ["tone", "story", "format"];

/**
 * The anchor's words, always with a real value. A theme only names what
 * defines it; mood, story and format are filled in with whatever its top
 * picks lean toward, so nothing ever reads "any".
 */
export function initialState(anchor: Anchor): TuneState {
  const slots: Slot[] = defaults(anchor)
    .filter(([, value]) => value !== ANY)
    .map(([dim, value]) => ({ dim, value, user: false }));
  const top = rank({ slots }, anchor, PICKS);
  for (const dim of REQUIRED) {
    if (!slots.some((s) => s.dim === dim)) slots.push({ dim, value: leaning(dim, top), user: false, inferred: true });
  }
  return { slots };
}

/** The value the top picks have most of. */
export function leaning(dim: Dim, picks: Title[]): string {
  const counts = new Map<string, number>();
  for (const t of picks.slice(0, 18)) {
    const v = dim === "story" ? t.tags.story[0] : t.dims[dim as keyof Title["dims"]];
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? Object.keys(VOCAB[dim].values)[0];
}

function prior(t: Title, anchor: Anchor): number {
  // Widely watched, well-reviewed titles lead when everything else is equal.
  // Vote volume tracks "people actually watched this" better than TMDB's
  // popularity score, which spikes for new and anime releases.
  const reach = Math.log10(1 + t.votes) * 0.75;
  const quality = Math.max(-1.2, Math.min(1.2, (t.vote - 6.8) * 0.6));
  // Animation only leads when the anchor is animated itself.
  const anchorAnimated = anchor.kind === "title" && anchor.title.genres.includes("Animation");
  const animation = t.genres.includes("Animation") && !anchorAnimated ? -0.9 : 0;
  return reach + quality + animation;
}

function overlap(a: Title, b: Title): number {
  const A = new Set([...a.keywords, ...a.genres]);
  let n = 0;
  for (const k of [...b.keywords, ...b.genres]) if (A.has(k)) n++;
  return n / Math.max(4, A.size);
}

export function score(t: Title, state: TuneState, anchor: Anchor): number {
  let s = prior(t, anchor);
  for (const slot of state.slots) {
    if (slot.value === ANY || slot.removed) continue;
    const w = (WEIGHT[slot.dim] ?? 1.3) * (slot.user ? 1.5 : slot.inferred ? 0.3 : 1);
    const m = hasValue(t, slot.dim, slot.value);
    s += m > 0 ? w * m : nearValue(t, slot.dim, slot.value) ? w * 0.35 : -w * 0.25;
  }
  if (anchor.kind === "title") s += 3 * overlap(anchor.title, t);
  return s;
}

const stemOf = (t: Title) => t.title.split(/[:\-–]/)[0].trim().toLowerCase();

/**
 * Best PICKS by score, chosen greedily with a penalty for repeating the same
 * lead story or the same franchise. Keeps every page varied.
 */
export function rank(state: TuneState, anchor: Anchor, n = PICKS): Title[] {
  const pool = TITLES.filter((t) => anchor.kind !== "title" || t.id !== anchor.title.id);
  const head = pool
    .map((t) => ({ t, s: score(t, state, anchor) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n * 4);
  const picked: Title[] = [];
  const storyCount = new Map<string, number>();
  const stems = new Set<string>();
  while (picked.length < n && head.length) {
    let bestI = 0;
    let best = -Infinity;
    for (let i = 0; i < Math.min(head.length, 60); i++) {
      const { t, s } = head[i];
      const adj = s - 0.45 * (storyCount.get(t.tags.story[0]) ?? 0) - (stems.has(stemOf(t)) ? 2 : 0);
      if (adj > best) {
        best = adj;
        bestI = i;
      }
    }
    const [{ t }] = head.splice(bestI, 1);
    picked.push(t);
    storyCount.set(t.tags.story[0], (storyCount.get(t.tags.story[0]) ?? 0) + 1);
    stems.add(stemOf(t));
  }
  return picked;
}

/** How many of `next` aren't already in `current`. */
export function newCount(current: Title[], next: Title[]): number {
  const have = new Set(current.map((t) => t.id));
  return next.filter((t) => !have.has(t.id)).length;
}

/**
 * Options for a slot. Story options come from what's common in the current
 * picks, so the list is about this set rather than the whole vocabulary.
 */
export function slotOptions(dim: Dim, current: Title[], value: string): string[] {
  const spec = VOCAB[dim];
  if (dim === "person" || dim === "keyword") {
    // Alternatives drawn from who and what is most common in the current picks.
    const counts = new Map<string, number>();
    for (const t of current) for (const n of dim === "person" ? [...(t.cast ?? []).slice(0, 3), ...(t.makers ?? [])] : t.keywords) counts.set(n, (counts.get(n) ?? 0) + 1);
    const ordered = [...counts.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    return [...new Set([value, ...ordered])].slice(0, 6);
  }
  if (dim !== "story") return Object.keys(spec.values);
  const counts = new Map<string, number>();
  for (const t of current) for (const s of t.tags.story) counts.set(s, (counts.get(s) ?? 0) + 1);
  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  const extra = ["romance", "crime", "adventure", "family", "comingofage", "scifi", "supernatural", "power"];
  return [...new Set([value, ...ordered, ...Object.keys(spec.groups ?? {}), ...extra])].slice(0, 6);
}

/** Words the viewer can take out of the sentence. The story is what the sentence is about, so it stays. */
export const removable = (dim: Dim) => dim !== "story" && dim !== "format";

/** How many titles carry every word in the description: the honest count behind "Top 36". */
export function fitCount(state: TuneState, anchor: Anchor): number {
  const live = state.slots.filter((s) => !s.removed && s.value !== ANY);
  return TITLES.filter((t) => (anchor.kind !== "title" || t.id !== anchor.title.id) && live.every((s) => hasValue(t, s.dim, s.value) > 0)).length;
}

/**
 * The endless blank. Suggest the detail that splits the current picks most
 * evenly, so filling it in changes the most. Every dimension not already in
 * the sentence is a candidate.
 */
export function blankDims(state: TuneState, current: Title[]): Dim[] {
  const used = new Set(state.slots.map((s) => s.dim));
  // People and keywords come from typing.
  const dims = (Object.keys(VOCAB) as Dim[]).filter((d) => !used.has(d) && !OPEN_DIMS.includes(d));
  const valueOf = (t: Title, d: Dim) => (d === "story" ? t.tags.story[0] : t.dims[d as keyof Title["dims"]]);
  const balance = (d: Dim) => {
    const counts = new Map<string, number>();
    for (const t of current) counts.set(valueOf(t, d), (counts.get(valueOf(t, d)) ?? 0) + 1);
    return counts.size < 2 ? 2 : Math.max(...counts.values()) / Math.max(1, current.length);
  };
  return dims.sort((a, b) => balance(a) - balance(b));
}

/** Why a title is on the page: the slots it matches, in the sentence's words. */
export function reasons(t: Title, state: TuneState): string[] {
  return state.slots
    .filter((s) => !s.removed && !(s.dim === "format" && s.value === "stories") && hasValue(t, s.dim, s.value) > 0)
    .map((s) => VOCAB[s.dim].values[s.value]?.chip ?? s.value);
}

/**
 * Card art for every theme: a named title if it's in the pool, otherwise the
 * theme's own top pick. Never repeated anywhere in the carousel, so a card
 * always shows something its sentence would actually surface.
 */
const ART = new Map<string, Title>();
{
  const used = new Set<string>();
  for (const theme of THEME_SETS.flat()) {
    const named = theme.art.map((n) => titleByName.get(n)).find((t) => t && !used.has(t.id));
    const anchor: Anchor = { kind: "theme", theme };
    const pick = named ?? rank(initialState(anchor), anchor, 12).find((t) => !used.has(t.id) && !t.genres.includes("Animation")) ?? TITLES[0];
    used.add(pick.id);
    ART.set(theme.id, pick);
  }
}

export function themeArt(theme: Theme): Title {
  return ART.get(theme.id) ?? TITLES[0];
}

/** Does a title carry every word in the description? */
export function fitsAll(t: Title, state: TuneState): boolean {
  return state.slots.every((s) => s.removed || s.value === ANY || hasValue(t, s.dim, s.value) > 0);
}

/**
 * When nothing fits every word, which word is to blame: the most recently
 * added one whose removal brings matches back. Falls back to the newest word
 * the viewer set, so there's always something to point at.
 */
export function conflictingSlot(state: TuneState, anchor: Anchor): number | null {
  if (fitCount(state, anchor) > 0) return null;
  // Most recently set first; untouched words in reverse sentence order after that.
  const byRecency = state.slots.map((s, i) => ({ s, i })).sort((a, b) => (b.s.at ?? -1) - (a.s.at ?? -1) || b.i - a.i);
  for (const { s, i } of byRecency) {
    if (s.removed) continue;
    const without = { slots: state.slots.filter((_, j) => j !== i) };
    if (fitCount(without, anchor) > 0) return i;
  }
  return byRecency.find(({ s }) => s.user)?.i ?? byRecency[0]?.i ?? null;
}

/**
 * Rephrase: the same idea, worded differently. Keeps what defines the anchor
 * (a theme's own words) and re-picks everything else from what the anchor's
 * wider pool leans toward, taking the `turn`-th most common value so each
 * press reads differently. Adds one extra clause. Only returns a phrasing
 * that at least 12 titles fit.
 */
export function rephrase(anchor: Anchor, current: TuneState, turn: number): TuneState {
  const defining: Slot[] = (anchor.kind === "theme" ? anchor.theme.slots : [["story", anchor.title.tags.story[0]] as [Dim, string]])
    .filter(([, v]) => v !== ANY)
    .map(([dim, value]) => ({ dim, value, user: false }));
  const pool = rank({ slots: defining }, anchor, 120);
  const ranked = (dim: Dim) => {
    const counts = new Map<string, number>();
    for (const t of pool) {
      const v = dim === "story" ? t.tags.story[0] : t.dims[dim as keyof Title["dims"]];
      if (v && v !== "-") counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).filter(([, c]) => c >= 6).map(([v]) => v);
  };
  const extras: Dim[] = ["era", "scare", "pace", "aim", "real", "world", "cast", "time"];
  const sig = (s: TuneState) => s.slots.map((x) => `${x.dim}:${x.value}`).sort().join("|");
  let fallback: TuneState | null = null;
  for (let attempt = 0; attempt < 16; attempt++) {
    const k = turn + attempt;
    // Every other attempt goes without the extra clause, which narrow themes often need.
    const withExtra = attempt % 2 === 0;
    const slots: Slot[] = [...defining];
    for (const dim of REQUIRED) {
      if (slots.some((s) => s.dim === dim)) continue;
      const opts = dim === "format" ? ["stories", ...ranked("format")] : ranked(dim);
      if (opts.length) slots.push({ dim, value: opts[(k + REQUIRED.indexOf(dim)) % opts.length], user: false, inferred: true });
    }
    const free = extras.filter((d) => !slots.some((s) => s.dim === d));
    const extraDim = withExtra && free.length ? free[Math.floor(k / 2) % free.length] : undefined;
    const extraOpts = extraDim ? ranked(extraDim) : [];
    if (extraDim && extraOpts.length) slots.push({ dim: extraDim, value: extraOpts[k % extraOpts.length], user: false });
    const next = { slots };
    if (sig(next) === sig(current)) continue;
    if (fitCount(next, anchor) >= 12) return next;
    if (!fallback && fitCount(next, anchor) > 0) fallback = next;
  }
  // Never hand back the same sentence: a narrower rewording beats no change.
  const initial = initialState(anchor);
  return fallback ?? (sig(initial) !== sig(current) ? initial : current);
}

/**
 * The options offered for one word, with how many titles fit everything if
 * you pick it. Options nothing would fit are left out (the current value
 * always stays, so you can see what's set). Story draws from every kind, so a
 * conflict can always be resolved from the list.
 */
export function wordOptions(state: TuneState, idx: number, anchor: Anchor, picks: Title[], limit = 7): Array<{ value: string; fits: number }> {
  const slot = state.slots[idx];
  const base = slotOptions(slot.dim, picks, slot.value);
  const all = slot.dim === "person" || slot.dim === "keyword" ? base : [...new Set([...base, ...Object.keys(VOCAB[slot.dim].values)])];
  const scored = all.map((value) => ({
    value,
    fits: fitCount({ slots: state.slots.map((x, i) => (i === idx ? { ...x, value } : x)) }, anchor),
  }));
  return scored.filter((o) => o.value === slot.value || o.fits > 0).slice(0, limit);
}

/** How many titles fit everything once this word is gone. */
export function fitsWithout(state: TuneState, idx: number, anchor: Anchor): number {
  return fitCount({ slots: state.slots.filter((_, i) => i !== idx) }, anchor);
}
