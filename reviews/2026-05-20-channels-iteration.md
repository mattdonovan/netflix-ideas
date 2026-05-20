# Review pass — Channels — iteration
Date: 2026-05-20
Prototype: Channels
Pass: iteration

## What's being reviewed
The Channels web surface after the card-pop / Top 10 / focus-model
iteration. Specifically: the new tile interaction (hover and keyboard focus
pop the card from center-center with `scale(1.32)`, no layout shift), the
restructured Top 10 row (slot height locked so poster and numeral share a
height by construction; expand morphs the portrait to a 16:9 backdrop), the
new `tokens.grouping` set (`cardGap: 8`, `rowGap: 32`, `rowReelPadding: 56`),
and the input-mode model (focus ring is keyboard-only; Escape and
outside-click clear focus). Snaps in `reviews/snaps/` from tv-1920,
laptop-1440, and mobile-390.

This pass is also the first one to run against the **web-forward**
reframing. The TV concerns still inform the code (D-pad nav lives, the safe
zone lives), but the surface being reviewed is the desktop browser at
1920px.

## The Couch Test
Adapted — read as "the back-of-room test" at desktop scale: full-screen
browser, 1080p, ~6ft viewing distance.
- **Focus visible <1s**: pass. The 1.32× pop is unmistakable, and the
  keyboard-only ring (2px + 8px glow) reads at distance.
- **Primary text readable without leaning**: pass for the hero, row titles,
  and tile titles when present. Fail-ish for the *meta line* inside the grey
  panel (rating chip, runtime, mood tags) at 11px — at distance these are
  decorative only, not readable.
- **Outer 5% clear**: pass. Hero gradient pulls content inboard; rows have
  TvFrame padding. The chevron buttons live inside the inset, not at the
  bleed.

## Anchor lens findings

### Frank Chimero
- **Opportunity:** The row, once created, looks finished. The "rename" path
  exists (the AI-magic icon next to the row title) but only appears on focus
  inside the row — passively, after the user has already gone hunting. The
  surface is not yet honest about being alive. Every row past the hero
  presents as a static gallery; nothing in the resting state telegraphs
  "this can keep becoming something else." For a product whose premise is
  *the row is a continuing conversation*, the design is hiding the
  conversation in a hover state.

### Josh Mateo
- **Opportunity:** The Top 10 row now reads as Netflix; the hero reads as
  Netflix. Everything between them does not — every other row is the same
  pitch, same card treatment, same height. Real Netflix breaks editorial
  rhythm: a row of textless boxart, a row with logo treatments, a
  second-billboard midway, a "Top 10" with its giant numerals. Right now
  "Critically Acclaimed", "Today's Top Picks", and "Your Next Watch" could
  be the same channel with the title swapped. The prototype lacks editorial
  variety, which is what makes Netflix feel curated rather than generated.

### Niyati Gupta
- **Opportunity:** The iteration loop is the load-bearing claim of this
  product, and the third iteration is not yet designed. The `T` shortcut and
  the AI-magic chip both open the same fresh `PromptPanel`. There is no
  visible history of what the user already tried, no path to *refine* a
  prior prompt rather than re-type, no acknowledgement that "more soul" was
  the previous attempt. A user who said "more soul" twice in a row gets two
  identical empty fields. That is a demo, not a loop.

### Diana Lu
- **Opportunity:** A first-time user lands on this surface and sees Netflix
  rows. There is no visible teach that the rows are user-shapable. The
  `RemoteCue` bar at the bottom helps but it's small, mute-colored, and
  references the `T` shortcut without context. The teach has to happen
  *before* the user concludes "this is just Netflix." A first-time hint —
  empty-row tutorial seed, or a one-time pulse on the AI chip — would close
  the gap between the surface's capability and the user's mental model.

### Matt D. Smith
- **Opportunity (1):** The focus ring is rendered as a static `box-shadow`
  on the card. When the card scales to 1.32×, the ring scales with it,
  which makes its perceived stroke *thinner*, not crisper. Counterintuitive
  for a focus signal. The ring should be drawn at a fixed pixel weight
  regardless of card scale — either via an outer wrapper that does not
  transform, or a pseudo-element compensated against the scale.
- **Opportunity (2):** The Top 10 numerals' white stroke is fixed at 2px.
  At lg/xl breakpoints the digit fontSize is 335–375px; a 2px stroke at
  that size reads as a hairline and the digit nearly disappears against the
  dark background. Stroke weight should scale with fontSize so the silhouette
  reads consistently across breakpoints.
- **Opportunity (3):** The card-pop transitions both `transform` and
  `box-shadow` together at 220ms. They land in lockstep. Staging the shadow
  (drop in ~80ms after the scale starts) would feel more like the card
  *lifts*; right now it feels like it teleports up.

### Stakeholder — Discovery PM
- **Challenge:** What metric does this move? If a user creates a Channel and
  the row looks final, they've replaced one curated row with one
  custom-curated row — same number of rows, same scroll depth, no
  iteration. The whole premise (and the per-user-per-month AI cost) is
  paid back only if iteration happens. Where in the design is the second
  prompt being earned? If the answer is "the user has to remember to come
  back," the design is shipping a one-shot tool with iteration claimed in
  the deck.

### Stakeholder — TV Engineering Lead (still applies on web for perf)
- **Challenge:** The `Tile` animates `box-shadow` alongside `transform`.
  `transform` is GPU-accelerated; `box-shadow` is not, and an animated
  shadow on a card with backdrop content can cause repaint storms on
  low-end devices. `willChange: transform` is set; `box-shadow` is not in
  willChange and probably shouldn't be — better to drop the shadow from the
  transition and use a static high-contrast shadow that just appears at
  scale-end. Also worth: the `aspect-ratio` transition on the inner image
  during the Top 10 morph triggers layout — measure on a throttled CPU.

## Guest lens findings

### Paco Coursey — behavioral state
- **Opportunity:** The `PromptPanel`'s state graph is incomplete. Loading,
  error, "no matches found," "Claude returned garbage," and "user dismissed
  mid-flight" — none of these are visible in the current snaps. The happy
  path is designed; the recovery is not. The same lens applies to the row
  itself: what does a Channel row look like *while* Claude is recategorizing?
  Right now it presumably just hangs in its previous state — the user has no
  signal that the system is working.

### Rauno Freiberg — motion craft
- **Opportunity:** Every card uses identical motion (`tokens.motion.focus`,
  220ms, ease-out quart). That is correct as a default, but the *Top 10
  morph* — portrait poster → landscape backdrop on expand — is doing a
  category of work the standard focus easing wasn't tuned for. The aspect
  ratio change is a content-shape change, not a focus state change; it
  wants a slightly slower, more deliberate curve so the morph reads as a
  reveal rather than a stutter. Right now the morph is hidden inside the
  scale animation and the artwork swap is abrupt (no crossfade). A reader
  can see the seam.

## Convergence
Frank, Josh, Niyati, and Diana all land on the same opportunity from
different angles: **the surface does not communicate its capacity for
ongoing change.** Frank reads it as a betrayal of the medium. Josh reads it
as a generic streaming UI without the editorial confidence Netflix would
bring. Niyati reads it as a missing iteration loop. Diana reads it as a
missing teach. Four lenses, one core decision: the design treats the
populated row as a finished object. That is the load-bearing critique of
this pass.

## Divergence
MDS wants more visual consistency — focus rings at fixed weight, strokes
scaled with size, shadow timing refined. Mateo wants more visual variety —
rows that differ in pitch, art treatment, and editorial role. These pull
in different directions: tighter rules at the card level, looser rules at
the row level. That tension is real and worth naming rather than smoothing:
the cards are a *system* and want consistency; the rows are an *editorial
surface* and want variety.

## The single biggest opportunity
**Make iteration visible in the resting state.** The row is the continuing
conversation; the design should show it. A persistent (not hover-gated)
affordance next to every AI-curated row title — a chip, a pulse, a "tap to
refine" prompt — would convert four converging critiques into a single move.

## Next moves
- **Commitment:** Move the AI-magic chip out of the hover-gated `titleSlot`
  and into the row's resting state. Make it always visible, scoped to
  AI-curated rows. Add a subtle 4s pulse on first appearance per row, then
  static. This closes the Frank / Diana / Niyati gap in one change.
- **Stretch:** `PromptPanel` history — when re-opening the panel for a row,
  show the previous prompts as editable chips, and let the user branch from
  any of them rather than starting fresh. This is the Niyati commitment:
  design the third iteration, not just the first.
