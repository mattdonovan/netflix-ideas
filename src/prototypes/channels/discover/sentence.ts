import { KEYWORDS, OPEN_DIMS, PEOPLE, VOCAB, phrase, wordParts, type Dim, type Title } from "./catalog";
import { blankDims, removable, touch, type TuneState } from "./engine";

/**
 * The sentence bar's language logic, separate from the UI so it can be tested
 * in Node (scripts/tests/discover-accuracy.ts): completions for typed text,
 * reading typed edits against the sentence, and suggested next details.
 */

export type Suggestion = { dim: Dim; value: string; label: string; kind: string; count?: number; fits?: number };

const PEOPLE_TRIGGER = /^(starring|with|by|directed by|from|featuring)\s+/i;
const ABOUT_TRIGGER = /^(about|involving)\s+/i;

export function fragmentOf(text: string): { q: string; trigger: "people" | "about" | null } {
  const parts = text.split(/,|\band\b/i);
  const raw = parts[parts.length - 1].replace(/^\s+/, "");
  if (PEOPLE_TRIGGER.test(raw)) return { q: raw.replace(PEOPLE_TRIGGER, ""), trigger: "people" };
  if (ABOUT_TRIGGER.test(raw)) return { q: raw.replace(ABOUT_TRIGGER, ""), trigger: "about" };
  return { q: raw, trigger: null };
}

/** Local completions for what's being typed, most likely first. */
export function suggest(text: string, state: TuneState): Suggestion[] {
  const { q, trigger } = fragmentOf(text);
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  const has = (dim: Dim, value: string) => state.slots.some((s) => s.dim === dim && s.value === value && !s.removed);

  const vocab: Array<Suggestion & { score: number }> = [];
  if (trigger !== "people") {
    for (const dim of Object.keys(VOCAB) as Dim[]) {
      if (OPEN_DIMS.includes(dim)) continue;
      for (const [value, v] of Object.entries(VOCAB[dim].values)) {
        if (has(dim, value)) continue;
        const names = [v.chip.toLowerCase(), v.phrase.toLowerCase(), value];
        const score = names.some((n) => n.startsWith(query)) ? 3 : names.some((n) => n.includes(` ${query}`)) ? 2 : names.some((n) => n.includes(query)) && query.length >= 4 ? 1 : 0;
        if (score) vocab.push({ dim, value, label: v.chip, kind: VOCAB[dim].label, score });
      }
    }
    vocab.sort((a, b) => b.score - a.score);
  }

  const people: Suggestion[] = [];
  if (trigger !== "about") {
    // "Brad" finds Brad Pitt before Dee Bradley Baker: a first name typed in full beats a later word.
    const scored: Array<{ name: string; count: number; score: number }> = [];
    for (const p of PEOPLE) {
      if (has("person", p.name)) continue;
      const n = p.name.toLowerCase();
      const words = n.split(" ");
      const score = words[0] === query || n.startsWith(`${query} `) ? 3 : n.startsWith(query) ? 2 : words.slice(1).some((w) => w.startsWith(query)) ? 1 : 0;
      if (score) scored.push({ ...p, score });
    }
    scored.sort((a, b) => b.score - a.score || b.count - a.count);
    for (const p of scored.slice(0, 4)) people.push({ dim: "person", value: p.name, label: p.name, kind: "Starring", count: p.count });
  }

  const keywords: Suggestion[] = [];
  if (trigger !== "people" && query.length >= 3) {
    for (const k of KEYWORDS) {
      if ((k.name.startsWith(query) || k.name.includes(` ${query}`)) && !has("keyword", k.name)) {
        keywords.push({ dim: "keyword", value: k.name, label: k.name, kind: "About", count: k.count });
        if (keywords.length >= 3) break;
      }
    }
  }

  const ordered = trigger === "people" ? people : trigger === "about" ? [...keywords, ...vocab.filter((v) => v.dim === "story")] : [...vocab.slice(0, 3), ...people, ...keywords];
  return ordered.slice(0, 5).map(({ dim, value, label, kind, count }) => ({ dim, value, label, kind, count }));
}

/** Adding a word: a fixed dimension takes the new value; people and keywords stack. */
export function withValue(state: TuneState, dim: Dim, value: string): TuneState {
  const at = touch();
  if (!OPEN_DIMS.includes(dim) && state.slots.some((x) => x.dim === dim)) {
    return { slots: state.slots.map((x) => (x.dim === dim ? { ...x, value, user: true, inferred: false, at } : x)) };
  }
  return { slots: [...state.slots, { dim, value, user: true, at }] };
}

/**
 * Typed words read against the sentence, without a model. Returns the new
 * state, or null when it needs Claude.
 *   "or anytime" / "any era" / "whenever"  → drop era
 *   "in the future" when era is set        → era = future
 */
export function readAgainst(typed: string, state: TuneState): TuneState | null {
  const t = typed.toLowerCase().replace(/^(or|and|but|maybe|actually|make it|instead)\s+/, "").replace(/[.!?]+$/, "").trim();
  for (const s of state.slots) {
    const spec = VOCAB[s.dim];
    if (removable(s.dim) && spec.loosen?.some((p) => t === p || t.endsWith(p))) {
      return { slots: state.slots.filter((x) => x !== s) };
    }
  }
  for (const dim of Object.keys(VOCAB) as Dim[]) {
    if (OPEN_DIMS.includes(dim)) continue;
    const spec = VOCAB[dim];
    for (const [value, v] of Object.entries(spec.values)) {
      const names = [v.chip.toLowerCase(), v.phrase.toLowerCase(), wordParts(dim, value).word.toLowerCase()];
      if (names.includes(t)) return withValue(state, dim, value);
    }
  }
  return null;
}

/** With nothing typed: the details most worth adding next, drawn from the current picks. */
export function nextDetails(state: TuneState, picks: Title[]): Suggestion[] {
  const out: Suggestion[] = [];
  for (const dim of blankDims(state, picks).slice(0, 4)) {
    const counts = new Map<string, number>();
    for (const t of picks) {
      const v = dim === "story" ? t.tags.story[0] : t.dims[dim as keyof Title["dims"]];
      if (v && v !== "-" && v in VOCAB[dim].values) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    // The second most common value: the most common one changes the least.
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
    const value = ranked[1] ?? ranked[0];
    if (value) out.push({ dim, value, label: phrase(dim, value), kind: "" });
  }
  const top = (list: string[]) => {
    const m = new Map<string, number>();
    for (const n of list) m.set(n, (m.get(n) ?? 0) + 1);
    return [...m.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const person = top(picks.flatMap((t) => (t.cast ?? []).slice(0, 3)));
  if (person && !state.slots.some((x) => x.dim === "person" && x.value === person)) out.push({ dim: "person", value: person, label: `starring ${person}`, kind: "" });
  const keyword = top(picks.flatMap((t) => t.keywords));
  if (keyword && !state.slots.some((x) => x.dim === "keyword" && x.value === keyword)) out.push({ dim: "keyword", value: keyword, label: `about ${keyword}`, kind: "" });
  return out.slice(0, 6);
}

export const VOCAB_TEXT = (Object.keys(VOCAB) as Dim[])
  .filter((d) => !OPEN_DIMS.includes(d))
  .map((d) => `${d}: ${Object.keys(VOCAB[d].values).join(", ")}`)
  .concat(["person: <full name>", "keyword: <short subject>"])
  .join("\n");

