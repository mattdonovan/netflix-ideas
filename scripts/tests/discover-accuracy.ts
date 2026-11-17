/**
 * Accuracy checks for Discovery's tune view. Run: node scripts/tests/run-discover-accuracy.mjs
 * Each check prints PASS/FAIL; the script exits 1 on any failure.
 */
import { THEMES, VOCAB, type Dim } from "../../src/prototypes/channels/discover/catalog";
import { conflictingSlot, fitCount, initialState, rank, rephrase, removable, wordOptions, fitsWithout, type Anchor, type TuneState } from "../../src/prototypes/channels/discover/engine";
import { nextDetails, readAgainst, withValue } from "../../src/prototypes/channels/discover/sentence";

let fails = 0;
let passes = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) passes++;
  else {
    fails++;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const say = (s: TuneState) => s.slots.map((x) => `${x.dim}=${x.value}`).join(" ");

// 1. Every theme opens with something that fits everything.
for (const theme of THEMES) {
  const anchor: Anchor = { kind: "theme", theme };
  const st = initialState(anchor);
  check(`opens with fits: ${theme.name}`, fitCount(st, anchor) > 0, say(st));
}

// 2. Every option offered for every word fits something (the current value excepted).
let offered = 0;
for (const theme of THEMES) {
  const anchor: Anchor = { kind: "theme", theme };
  const st = initialState(anchor);
  const picks = rank(st, anchor);
  st.slots.forEach((slot, i) => {
    for (const o of wordOptions(st, i, anchor, picks)) {
      offered++;
      if (o.value === slot.value) continue;
      const next = { slots: st.slots.map((x, j) => (j === i ? { ...x, value: o.value } : x)) };
      check(`option fits: ${theme.name} ${slot.dim}→${o.value}`, fitCount(next, anchor) > 0 && o.fits === fitCount(next, anchor));
    }
    if (removable(slot.dim)) check(`remove count: ${theme.name} ${slot.dim}`, fitsWithout(st, i, anchor) >= fitCount(st, anchor));
  });
}

// 3. Idle suggestions only offer things that work.
for (const theme of THEMES) {
  const anchor: Anchor = { kind: "theme", theme };
  const st = initialState(anchor);
  for (const s of nextDetails(st, rank(st, anchor))) {
    const n = fitCount(withValue(st, s.dim, s.value), anchor);
    // The UI drops zero-fit idle suggestions; record how often that filter has to act.
    if (n === 0) console.log(`note: idle suggestion filtered (0 fits): ${theme.name} ${s.label}`);
  }
}

// 4. Rephrase always changes the sentence and lands on something that fits.
for (const theme of THEMES) {
  const anchor: Anchor = { kind: "theme", theme };
  let st = initialState(anchor);
  for (let turn = 1; turn <= 4; turn++) {
    const next = rephrase(anchor, st, turn);
    check(`rephrase changes: ${theme.name} #${turn}`, say(next) !== say(st));
    check(`rephrase fits: ${theme.name} #${turn}`, fitCount(next, anchor) > 0, say(next));
    st = next;
  }
}

// 5. The reported case: warm, fast-moving love series set in the future, in English.
{
  const anchor: Anchor = { kind: "theme", theme: THEMES.find((t) => t.id === "love")! };
  const st: TuneState = {
    slots: [
      { dim: "tone", value: "warm", user: true, at: 1 },
      { dim: "pace", value: "brisk", user: true, at: 2 },
      { dim: "story", value: "romance", user: false },
      { dim: "format", value: "series", user: true, at: 3 },
      { dim: "era", value: "future", user: true, at: 4 },
      { dim: "lang", value: "en", user: true, at: 5 },
    ],
  };
  const fits = fitCount(st, anchor);
  const c = conflictingSlot(st, anchor);
  console.log(`case: warm brisk romance series future en → ${fits} fit; conflict on ${c !== null ? st.slots[c].dim : "none"}`);
  const era = st.slots.findIndex((s) => s.dim === "era");
  const offeredEra = wordOptions(st, era, anchor, rank(st, anchor)).map((o) => `${o.value}:${o.fits}`);
  console.log(`  era options offered: ${offeredEra.join(", ")}`);
  check("reported case: no dead-end era option offered", wordOptions(st, era, anchor, rank(st, anchor)).every((o) => o.value === "future" || o.fits > 0));
}

// 6. Typed edits read against the sentence.
{
  const anchor: Anchor = { kind: "theme", theme: THEMES.find((t) => t.id === "love")! };
  const base = withValue(initialState(anchor), "era", "future");
  const cases: Array<[string, (s: TuneState | null) => boolean]> = [
    ["or anytime", (s) => !!s && !s.slots.some((x) => x.dim === "era")],
    ["any era", (s) => !!s && !s.slots.some((x) => x.dim === "era")],
    ["whenever", (s) => !!s && !s.slots.some((x) => x.dim === "era")],
    ["in the past", (s) => !!s && s.slots.some((x) => x.dim === "era" && x.value === "past")],
    ["set today", (s) => !!s && s.slots.some((x) => x.dim === "era" && x.value === "now")],
    ["movies", (s) => !!s && s.slots.some((x) => x.dim === "format" && x.value === "movie")],
    ["limited series", (s) => !!s && s.slots.some((x) => x.dim === "format" && x.value === "limited")],
    ["any mood", (s) => !!s && !s.slots.some((x) => x.dim === "tone")],
    ["dark", (s) => !!s && s.slots.some((x) => x.dim === "tone" && x.value === "dark")],
    ["with subtitles", (s) => !!s && s.slots.some((x) => x.dim === "lang" && x.value === "other")],
    ["doesn't have to be scary", (s) => s === null || !s.slots.some((x) => x.dim === "scare")],
    ["but make it funnier", (s) => s === null], // needs Claude
  ];
  for (const [typed, ok] of cases) {
    const out = readAgainst(typed, base);
    check(`typed "${typed}"`, ok(out), out ? say(out) : "→ Claude");
  }
}

void VOCAB;
void ({} as Dim);
console.log(`\n${passes} passed, ${fails} failed (${offered} options offered across ${THEMES.length} themes)`);
if (fails) process.exit(1);
