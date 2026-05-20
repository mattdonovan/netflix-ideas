# Review pass — Channels — first pass

Date: 2026-05-19
Prototype: Channels
Pass: first

> **Reviewer note.** This is a code-driven review — the lenses were applied by reading the implementation rather than by sitting on a couch and operating the prototype. Visual + tactile verification still owed. A second pass should run the dev server, walk to the other side of the room, and re-run the Couch Test physically before this review is considered closed.

## What's being reviewed

The Channels prototype's first complete pass:
- A Hawkins-flavored MUI theme (dark, off-white text, accent at `#E4404C`, Inter as Netflix Sans stand-in, 24pt body floor, focus ring + scale-up, motion curves tuned for TV).
- Spatial focus manager — section + index model, arrow keys, fixed-focus-content-slides pattern.
- TV primitives: `TvFrame` (5% safe zone, 1920×1080 canonical), `FocusRing`, `Tile`, `Row`, `RemoteCue`, `MicState`.
- Channels home with three seed channels ("Movies with warm cinematography," "New nostalgia," "Monster movies with soul"), each a Row of focusable tiles using mood-derived color blocks instead of copyrighted artwork.
- `PromptPanel` overlay: idle → submitting → preview → accept/refine, multi-turn conversation preserved across refines.
- Real Claude API integration (Haiku 4.5) via structured tool use returning `{title, tags, tone, moodColor, exemplars}`; deterministic mock fallback when no key is configured.
- Experiments sandbox at `/experiments` with registry + side-by-side compare view.

## The Couch Test

*Applied to the code, not the rendered surface. Re-run physically.*

- **Focus visible <1s** — Likely **pass**. Focus uses `scale(1.08)` + bright `#F5F5F5` ring at 4px + glow shadow + blooming the active tile. From the implementation, the focus signal stacks four channels (scale, ring, shadow, glow) which should clear the one-second find heuristic. *Verify*: does the focus ring sit *outside* the tile artwork (where it belongs) or get clipped by `overflow: hidden`? The Tile component has `overflow: hidden` on the artwork box, which is *inside* the FocusRing — so the ring is on the outer wrapper and should not clip. OK.
- **Primary text readable without leaning** — **Pass**. Body is 24px; tile title is 20px; tile caption is 14px (only acceptable because it's italicized supporting copy, not primary). The 14px caption is a borderline call and may fail the test in person. Flag.
- **Outer 5% clear** — **Pass**. `TvFrame` enforces 96px × 54px (5%) safe-zone margins; all content sits inside. `RemoteCue` is absolutely positioned to bottom: 0 *within* the safe-zone container, so it sits at the bottom of the inner content box — technically inside, but visually right at the edge. Re-verify on a real screen: does the cue read as "comfortably inside" or "stuck against the bezel"?

## Anchor lens findings

### Frank Chimero — "screens want flux"

**Opportunity (load-bearing):** The moment of revelation — when the user accepts a generated category and the row's tiles + title update — is not designed. The code does a synchronous state swap. No stagger, no morph, no entrance choreography. This is the payoff moment of the entire feature, and right now it's a snap. Frank's question would be: "Where in this prototype is the *change* visible? The whole feature is about the user mid-stream changing the world; the screen should feel like it's mid-stream changing too."

Specifically:
- The PromptPanel preview appears with a single 400ms fadeIn keyframe on the panel wrapper, but the preview content itself just renders.
- The Submitting state shows static text "Asking the Ranker" with no rhythmic feedback under it. The row underneath sits frozen during the AI call.
- After `onAccept`, tiles are replaced via React state — no exit animation, no entrance animation, no title cross-fade.

**Where it cleared:** The MicState component does honor flux — breathe + ripple animations communicate "listening" through motion. Good. The empty rows have a baseline (always populated by seeds) so the "void" failure mode doesn't yet apply, but it will when we add user-created channels.

### Josh Mateo — Hawkins point of view

**Opportunity:** The Hawkins-flavored layer is not yet a point of view. The visual vocabulary (dark, near-square posters, off-white text, scale-and-ring focus) is the streaming-service baseline — re-skinnable as HBO Max or Disney+ in under an hour. The single Netflix-flavored signal in the prototype is the warm-red accent (`#E4404C`), which appears only on the "NF" wordmark and the loading-state copy. Mateo's question: "What's one detail that couldn't exist in another company's system?" *I cannot honestly name it.* The system has a tone but not a stance.

Candidates for where stance could be introduced (not done):
- The transition curve for focus is `cubic-bezier(0.22, 1, 0.36, 1)` — solid out-quart, but generic. Netflix's actual focus curve has a more pronounced settle. Worth tuning explicitly.
- Tile bloom is 1.08× — also generic. Netflix in production runs ~1.10–1.12 with a slight depth (z-translation). Worth claiming.
- The mood-color side-stripe on the preview card is a real candidate for a system signature — color as semantic, not decorative. But it appears once and isn't repeated elsewhere.

**Architectural finding:** The plan was to wrap MUI behind Hawkins primitives so app code never imports `@mui/material` directly. The implementation broke this discipline almost everywhere — `App.tsx`, `Channels.tsx`, `PromptPanel.tsx`, `Experiments.tsx` all import `Box`/`Typography` directly. The Hawkins layer is only the theme, not the component wrappers. Mateo's question: "If I swapped MUI for Mantine next week, how much would break?" Today, a lot.

### Niyati Gupta — AI as design material, growth, inclusive

**Opportunity:** The third iteration of the prompt is partially designed — multi-turn conversation history is preserved across refines, the Claude call accepts the history, and the user can iterate. Good. **But there is no diff.** The user submits "less monster, more soul" and the preview re-renders with no visual indication of *what changed* between turn 1 and turn 2. The interaction lives or dies on the user being able to see the AI converging with them; right now they have to remember the previous result and compare in their head.

Smaller opportunities:
- **Voice is asserted, not verified.** The system prompt instructs "Netflix-confident, never cute, no emojis" — but there's no fixture, no snapshot test, no review pass against actual outputs. A spot check with two or three real prompts would tell us whether Claude's voice actually feels Netflix.
- **Inclusive surface is not designed.** The prompt input expects fluent English natural language and a vocabulary of Western film genres. Users who don't think in "monster movies with soul" terms have no path in.
- **AI failure mode is bland.** Error state shows a single line of red text. When the Ranker returns garbage (or Claude misfires), the design should still feel like Netflix. Right now it falls back to a default browser-ish error treatment.

### Diana Lu — interface as argument; teaching

**Opportunity:** A first-time user lands on Channels and sees three rows of posters. They have to read the bottom RemoteCue strip to learn they can press T to tweak. The teaching is technically *present* but not *prominent* — the strip is small (`fontSize: 18px` cue label, ~5% of screen height), and it competes with three feature-rich poster rows above it.

Diana's question: "What's the first thing a user understands? Second? Third?"
1. **First:** "This looks like Netflix." ✓ — strong baseline pattern recognition.
2. **Second:** "There are rows of titles I can browse." ✓ — focus visible, navigation obvious.
3. **Third:** "I can change these rows." ✗ — buried in the cue strip; the row titles don't signal editability; the channel-meta line ("warm · intimate · deliberate") reads as metadata, not as something *the user wrote*.

The empty-state for a future user-created channel is the strongest place to put teaching. Today, that state isn't designed — every channel starts populated.

**Cleared:** Copy is intent-oriented ("What do you want to watch?") not feature-oriented ("Customize your channel"). The placeholder is exemplar-by-example, which is the right pedagogy. Both good.

### Matt D. Smith — proportion, restraint, atomic

**Opportunity (proportion):** Border radius is inconsistent across surfaces that play similar roles. Tiles use `radius.sm` (4px). The preview card in PromptPanel uses `radius.md` (8px). The text input uses `radius.md` (8px). The chips use `radius.pill`. Tiles and preview cards both represent "a chunk of curated content" — they should rhyme. Probably both 4px (square), or both 8px. As written, the visual language splits between them.

**Opportunity (restraint):** Two chip variants in the PromptPanel preview (filled for tags, outlined-muted for tone) carry the distinction between "category routing" and "ranker bias." Defensible but reads as two competing emphasis tokens on the same surface. Could a single chip style + a leading label ("Tags:" / "Tone:") do the work with less visual machinery?

**Cleared:** Focus ring (4px) matches tile corner radius (4px) — a deliberate rhyme. Spacing scale is consistent (4px base, doubling). Typography scale is consistent (24px floor, 14px micro for non-essential only). Mic disc proportions check.

### Stakeholder — Hawkins Lead (composite)

**Challenge:** "Where did you fork what should have been a token override? Where did you import `@mui/material` directly?" — Across App.tsx, Channels.tsx, PromptPanel.tsx, Experiments.tsx, every primitive file. The plan said wrappers; the implementation skipped them. If we swap MUI later, this is the migration debt that returns. Track it.

### Stakeholder — Discovery PM (composite)

**Challenge:** "What metric moves if Channels ships?" — Not designed. No event taxonomy, no telemetry hooks, no defined success metric. For a prototype this is OK; for the writeup it would be a hole if we don't propose one. Candidates: time-to-first-play after channel edit; channel-tweak repeat rate (how often does the user iterate?); discovery diversity score (how many unique tags did the user surface compared to default recommendations?).

**Cost story:** Each categorize call hits Claude Haiku 4.5. At ~1500 tokens per call, that's <$0.01 per tweak. Cheap, but unbounded — a user who tweaks 100 times in a session costs us $1. Worth a soft cap.

### Stakeholder — TV Engineering Lead (composite)

**Challenge:** The focus model does not trap focus when the PromptPanel is open. Arrow keys still navigate the row underneath; if the user mid-categorization presses an arrow, the underlying row scrolls behind the modal. State leak.

Secondary: the AI call has no debounce — pressing Enter twice fires two requests. Pressing T while a request is in-flight could open a new panel state. Race conditions not enumerated.

## Guest lens findings

### Rauno Freiberg — motion craft

**Opportunity:** Easing curves are right (out-quart-ish for focus, fast in-out for press), but motion is missing at the high-leverage moments. The preview pane appears without entrance choreography. The accept moment skips animation entirely. The error state has no motion to acknowledge that something went wrong — it just shows red text. Motion in this prototype is currently *ambient* (mic breathe, focus glide) but not *narrative*.

### Paco Coursey — state machines

**Opportunity:** The PromptPanel enumerates `idle | listening | submitting | preview | error` — but `listening` is unreachable in the code (Web Speech API isn't wired up). The state exists as a placeholder. Either implement it or remove it; placeholder states in a state machine are landmines.

Missing states:
- **Idle + in-flight** (user already submitted, response pending) — currently merged with `submitting`, but the input is still editable. The input should disable.
- **Empty response** — Claude could return a tool use with `exemplars: []`. The preview would render a card with no titles. Not handled.
- **Rate-limited / network-failed** vs. **bad-input error** — both currently surface as a single red string.
- **Pre-T (no panel)** vs. **post-T (panel open)** keyboard model. As noted under TV Engineering: arrows leak into the underlying row while the modal is open.

## Convergence

Three lenses converge on the same finding: **the prototype is well-structured but under-animated at its high-leverage moments**. Frank says the surface should feel mid-stream; Rauno says the motion isn't narrative; Paco says transitions between states aren't enumerated. They're describing the same gap from three angles. This is the strongest signal in the review.

Two lenses converge on **the Hawkins layer isn't a point of view yet** — Mateo names it as the system question; MDS names it as a proportion problem (radius inconsistency, two chip variants where one would do). Sharper tokens + sharper discipline are the path.

Two lenses converge on **the AI iteration loop is partial** — Gupta on the missing diff between turns; Paco on the missing in-flight state. The loop works in the happy path but doesn't support the third tweak.

## Divergence

Diana wants more teaching at first-touch (a louder cue that the user can edit the row). Discovery PM and TV Engineering want more restraint and stability (the modal should trap focus, the request should debounce, the cost should be bounded). These point in opposite directions — more affordance vs. less affordance. The right read: **make the editability obvious *at the row title*, not at the global level.** The title is the natural locus; a small "T" cue next to the active row's title would teach without adding global chrome.

## The single biggest opportunity

**Design the moment of revelation — the user accepts a generated category and the row rebuilds — as the most choreographed interaction in the prototype.** Today it's a synchronous state swap; the payoff of the entire feature is also its dullest visual moment. Get this right and Frank, Rauno, Paco, *and* Mateo all light up in one move.

## Next moves

- **Commitment (small, must-land):**
  Choreograph the accept transition. When `onAccept` fires: (1) close the PromptPanel with a quick exit (180ms), (2) cross-fade the row title from old to new (400ms), (3) old tiles exit left with a stagger (50ms between each, ease-in 200ms), (4) new tiles enter from right with a stagger (60ms between each, ease-out-quart 360ms). This is one focused commit. It will produce a visible difference in every demo.

- **Stretch (ambitious, conditional):**
  Wire the diff into the preview pane. When `history.length > 0` and a refined preview comes back, highlight which tags + tone words are *new* this turn (background flash + a "+ added this turn" micro-label). Gives the user — and any viewer of the demo — direct evidence the AI is responding to the specific refinement, not regenerating from scratch. This is the move that makes the iteration loop feel like collaboration instead of re-rolling.

---

## Notes on what was NOT reviewed

- The actual rendered surface (couch test was code-only; rerun in browser before closing this review).
- The Invite prototype (not built yet — planned for next pass).
- Real Claude output quality (no fixtures, no voice-check).
- Performance on TV-class hardware.
- Accessibility (screen reader, reduced motion, contrast against bright TVs).

These are open and should appear on the next review pass's not-reviewed list until they're addressed.
