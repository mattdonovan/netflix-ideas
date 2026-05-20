# Channels — MDS pass 2

**Date:** 2026-05-19
**Scope:** Channels prototype after the Figma integration sweep — real artwork, hero billboard, Netflix wordmark, 16:9 boxart tiles, expanded focus state, soft focus ring, idle-fade cue.
**Reviewer lens:** Mateo (Netflix product judgment), Chimero (flux as capacity for change), Couch Test (10ft viewing realism).

This review is about the product, not the system. The aim is to identify what reads as Netflix-shaped vs. what reads as approximation, and to spot the next 3–5 highest-leverage product moves.

---

## What landed since pass 1

| Pass-1 finding | Status |
|---|---|
| Tile content treatment — title baked into art | ✅ Boxart + title-overlay shipped |
| Caption/metadata typography | ✅ Subtitle = micro size, tertiary text, idle fade |
| Header restraint — drop "NF" wordmark | ✅ Replaced with Netflix wordmark in brand red |
| FocusRing → soft ring (drop outline) | ✅ Layered box-shadow, no hard outline |
| RemoteCue idle-fade | ✅ 4s idle → fade to 0.25, return on input |
| Acceptance moment choreography | ⚠️ Still TODO — see below |
| PromptPanel preview/refine/focus return | ⚠️ Still TODO |
| MicState — pick one effect per state | ⚠️ Still TODO |

---

## Couch Test — pass 2

| Test | Result | Notes |
|---|---|---|
| Title legibility on focused tile | ✅ Pass | Title-baked-into-art is now load-bearing — reads at 10ft |
| Caption legibility on unfocused tile | ✅ Pass | Subtitle in micro size sits below the card; tertiary color is intentional |
| Focus signal visibility | ✅ Pass | Soft inner-stroke + glow + lift reads as "this one" from across the room |
| Brand recognition | ✅ Pass | Netflix wordmark + brand red badges + boxart format are immediately Netflix |
| Action discoverability | ⚠️ Mixed | Expanded controls appear on focus, but the row's vertical shift creates jitter when navigating between tiles |
| Cursor / focus parity | ✅ Pass | Cursor remains visible; focus is still primary |

---

## What's working — and why

**The boxart + title overlay is the unlock.** The pass-1 review said "color-block tiles look like iTunes 2008." The fix wasn't a color change; it was an artwork change. Real TMDB backdrops with Bebas-bold title overlays now read as 2024 Netflix at first glance, no second-guessing. The Couch Test's hardest question — "is this Netflix?" — gets answered by the eye in <500ms.

**The expanded focus state moved focus from cue → content.** Pass 1 had focus signalled by ring + bloom. Pass 2 adds: when you land on a tile, the tile *tells you what you're about to do* — play/add/like, plus year, runtime, rating, and mood. That's the Netflix hover-card pattern translated into TV's focus model. It's why the prototype feels less like "a TV grid" and more like "a Netflix interaction loop."

**The Netflix wordmark earned its place.** The pass-1 worry was that branding would tip into pastiche. With the brand red moved off the system accent and into a single named slot (`tokens.color.brand`), the wordmark + badge pill + hero CTA are the only three places where Netflix red appears. That's restraint — the quotation has scarcity, which is what keeps it from feeling like a knockoff.

**Idle fade on the RemoteCue is the kind of detail that goes unnoticed and is therefore correct.** Cue teaches once, then disappears — the way real TV apps teach navigation through focus state rather than persistent on-screen chrome.

---

## What's not working yet

### 1. Row height shifts when focus moves between tiles
**The issue.** The expanded controls panel renders below the focused tile, adding ~80px of height. Adjacent rows shift downward each time focus moves. On TV this is jitter the user will feel even if they don't see it.

**Mateo's read:** Netflix's hover-card overlays adjacent content with `z-index` rather than pushing it. For TV-focus parity we should either (a) absolute-position the expansion so it overlaps the next row, or (b) reserve the expansion height in the row at all times (visibility hidden when unfocused).

**Recommendation:** Option (a). The brief overlap with the next row's title is acceptable; Netflix lives with the same trade-off.

### 2. Acceptance moment choreography is still missing
**The issue.** When a user submits a prompt in PromptPanel and the Ranker fills the row, there's no visual flourish marking the transition. The new tiles appear, that's it.

**Chimero's read:** This is where flux *should* matter — the screen has the capacity to change, but right now it's changing silently. The user's intent (a description in their own words) becomes content (a row of titles). That transformation deserves a beat: a brief red flash on the channel meta dot, a stagger of tile entrances, the wordmark pulsing once. Without it the moment feels like a content swap, not an act of authorship.

**Recommendation:** 480ms entrance cascade — channel title fades up first, then meta dot pulses brand red, then tiles stagger in left-to-right at 60ms intervals. Reuse `tokens.motion.duration.entrance`.

### 3. PromptPanel hasn't been touched yet
**The issue.** The panel still uses a custom textarea, not the new themed `MuiTextField`. The accept flow doesn't show a preview of *what changed* (old category vs. new category). The "Refine" affordance doesn't carry context from the previous prompt.

**Mateo's read:** This is the most product-shaped part of the prototype — the place where the value prop ("describe a row in your own words") lives. It deserves the same care as the tile work just got.

**Recommendation:** Sweep #3. Refactor to MuiTextField (already themed). Add a left/right preview pane showing the diff between current category and proposed category. Carry refine context (last prompt + last category) so "Refine" is genuinely refining, not just re-prompting.

### 4. Mobile is still letterboxed-to-blank
**The issue.** The TvFrame's max-width approach fixed the right-anchor issue at laptop widths but at 390px mobile, the boxart row still runs off-screen.

**Reality check:** This is a TV prototype. Mobile-blank is honest. The right move isn't a responsive mobile layout — it's a tiny "this is a TV-first prototype, view on a larger screen" affordance shown only at <600px viewports. That's a sweep #3 item, not a defect to fix today.

### 5. The "TOP OF ROW" badge is dev-shaped, not product-shaped
**The issue.** Real Netflix badges are content-derived: "Recently Added", "New Episode", "Top 10", "Leaving Soon". "Top of row" is meta about the row, not about the content.

**Recommendation:** Have the Ranker (or seed data) tag each exemplar with a real badge type. Drop "Top of row" entirely. The position-of-row doesn't deserve a badge — the *content* does.

---

## Top 5 sweep-3 moves

In order of leverage:

1. **Acceptance moment choreography** — the missing beat between "I described a row" and "here's the row." Biggest emotional uplift for the smallest code change.
2. **Expanded card overlay** — absolute-position the expansion panel to stop row-height jitter. Code-only, no design decision.
3. **PromptPanel refactor** — MuiTextField + diff preview + refine carries context. The product's center of gravity deserves this attention.
4. **Real content-derived badges** — drop "Top of row", let the Ranker tag exemplars with "Recently Added" / "Top 10" / "New Episode" / "Leaving Soon".
5. **Mobile guard** — show a small "view on a larger screen" overlay at <600px. Honest, scoped, 20 lines of code.

---

## What pass 2 leaves in better shape than pass 1

- The brand vocabulary is finally a vocabulary, not a guess. Brand red is rare, wordmark is restrained, badges are clear, focus is soft.
- The content-driven thesis ("the prototype is about content, not about the system") is visible in the work — real artwork, real titles, real meta. A reviewer can argue with the *idea* instead of squinting past the placeholders.
- The MDS review itself is shorter than pass 1, which is the right direction — when a prototype gets sharper, the review should too.
