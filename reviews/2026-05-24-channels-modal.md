# Review pass — Channels — switch-modal close read
Date: 2026-05-24
Prototype: Channels
Pass: iteration (modal-focused)

## What's being reviewed
The `SwitchChannelsModal` in isolation — header copy, the 7-slat
`ChannelsWave` decoration, the `PromptInput` pill (rest → expanded
morph, mic + submit affordances), the four `PROMPT_SUGGESTIONS` chips,
the "Or try some of these:" `PopularChannels` grid (6 cards: hover
ken-burns, video card, dissolving description gradient). No new code
since the 2026-05-22 reviews — the modal is the same artifact, but
this pass holds it up as a self-contained surface rather than as one
node inside the broader switch-flow.

The first pass under the new carryover/graduation discipline. Two
critiques graduate to `context/project-rules.md` rather than re-firing.

## Carryover from prior review
Prior reviews:
[2026-05-22 prompt-flow](./2026-05-22-channels-prompt-flow.md),
[2026-05-22 switch-flow](./2026-05-22-channels-switch-flow.md).

- **Frank Chimero** — sit out on the row's End-card terminus (tracked
  in #34 and the switch-flow review's headline). New modal-level
  finding below.
- **Josh Mateo** — graduate the designer-voice-copy critique to
  `project-rules.md` (3 passes flagged, still recurring on this
  surface's card descriptions). New modal-level finding below.
- **Niyati Gupta** — graduate AI-as-theater to `project-rules.md` (3
  passes flagged: iteration loop, mic-as-glyph, MIN_THINKING_MS). New
  modal-level finding below.
- **Diana Lu** — sit out on the cycling-message teach (tracked in
  #38). New modal-level finding below.
- **Matt D. Smith** — sit out on ScrambleText scaling and message
  width (tracked in #37). New modal-level finding below.

## The Couch Test
At 1080p, full-screen browser, ~6ft back, modal open.
- **Focus visible <1s**: pass on the pill (border lights up to white
  when focused). Fail on the chips — no visible focus state distinct
  from hover. Fail on the close button (36px, top-right, no focus
  ring). On TV neither would be reachable cleanly.
- **Primary text readable**: pass on "Change this channel" (42px) and
  "Or try some of these:" (22px). Borderline on the 12px card
  description (only visible on hover anyway, but tight).
- **Outer 5% clear**: pass. Modal is centered at maxWidth 850;
  nothing pinned to viewport edges.

## Anchor lens findings

### Frank Chimero
- **Carry:** Sit out the End-card terminus carry (tracked elsewhere).
- **Opportunity (modal):** The `ChannelsWave` is the most flux-honest
  motif in the prototype — 7 slats endlessly tilting between 75° and
  105°, never resting, *visibly always becoming*. But it doesn't
  *listen*. The wave plays the same forever, regardless of what the
  user types, what channel they're switching, or what time of day it
  is. A surface alive would let the wave respond — tilt amplitude
  growing as the input fills, color stops re-mapping to the channel
  being replaced, the cadence slowing when the user pauses to think.
  Right now the wave is decorative flux, not responsive flux. It says
  "channels are alive" abstractly when it could say "this channel,
  this prompt, this moment is alive" specifically. Also: the four
  prompt chips are static across every session forever — they're a
  canned list pretending to be suggestions. A surface that remembered
  would surface a chip the user invented last time.

### Josh Mateo
- **Graduate:** Designer-voice copy promoted to
  `context/project-rules.md` (rule: "Netflix voice for system copy").
  Card descriptions on this surface keep tripping the same wire
  ("Dax & Monica, mystery science theater style with your favorite
  armchair anonymous guests" runs three clauses; "We could all use a
  little bit more of that, couldn't we?" is editorial). The lens
  stops re-flagging; the rule does the work going forward.
- **Opportunity (modal):** The card titles themselves are the next
  thing to push on. "Armchairies", "Upside-down", "Your friends",
  "It's Leo season!" — these read as the *designer's* taste, not
  Netflix's. Real Netflix curated titles are genre-derived
  ("Critically Acclaimed Movies", "Quirky Indies", "Because You
  Watched X"). The current set is closer to a SXSW panel name. The
  problem isn't whimsy — Netflix has whimsy — it's that the whimsy
  doesn't read as *Netflix-curated*. Even the "Channels" pitch needs
  to feel like it belongs in the Netflix product, not next to it.

### Niyati Gupta
- **Graduate:** AI-as-theater promoted to `context/project-rules.md`
  (rule: "AI features ship the loop, not the demo"). This modal trips
  the rule twice: the mic icon implies a voice input modality that
  isn't built, and the four prompt chips never adapt to what the user
  has done. Both are AI-features-as-decoration. The lens stops
  re-flagging; the rule does the work.
- **Opportunity (modal):** The prompt input is opened cold — empty,
  no context about the channel being switched. The user is switching
  *their Action & Adventure row*, but the input doesn't seed
  "Action but more __" or even acknowledge the row's name. A
  graduated AI surface would use what it knows. The chips below are
  generic to all channels for the same reason. The cheapest first
  move: seed the placeholder with the channel name, "Replace
  'Action & Adventure' with…".

### Diana Lu
- **Carry:** Sit out the cycling-message teach (tracked in #38).
- **Opportunity (modal):** "Or try some of these:" is teaching the
  wrong sequence. The header positions the curated cards as the
  *fallback* path — second-best, what to try when the input fails. The
  product truth is the opposite: the cards are the most-tested, most-
  reliable surface; the prompt is the riskier path. Reverse the
  teach. Either put the cards above the input ("Pick a channel — or
  describe one"), or relabel ("These are working today: ___").
  Right now the modal subtly tells the user the AI is the headline
  *and* the fallback is the safer move — contradictory teach.

### Matt D. Smith
- **Carry:** Sit out the scramble/width carries (tracked in #37).
- **Opportunity (modal):** The pill-to-rounded-square morph on
  focus is the modal's best micro-craft moment — proportion-aware,
  paced right, the rest state actually reads as an invitation and the
  expanded state actually reads as a writing surface. But the
  mic-and-submit dance inside the expanded pill is confused: two
  36×36 icon buttons fight for the right-side gutter, one slides
  from center-right to bottom-right-of-bottom-row while the other
  fades in next to it. Same affordance space, two affordances, no
  hierarchy. Either drop the mic entirely (the icon means nothing
  today — see the project rule) or move it to a different surface
  (top-left of the pill, mic-button-as-prefix). Adjacent: the
  PopularChannels grid is `1fr 1fr` at xs, `repeat(3, 1fr)` at sm+.
  At sm the cards are ~270px wide and 4:5 = ~340px tall, and the
  5-line clamped description at 12px lives in roughly 240×80. That's
  reading-strain proportion. Either 2 cols all viewports or shorter
  descriptions (or both).

### Stakeholder — Discovery PM
- **Challenge:** The modal hands the user three input paths: type a
  prompt, tap a chip (which fills the prompt), pick a card. The
  card path has the lowest friction by a wide margin — one click,
  done. The PM question: if 80% of users pick a card, the AI prompt
  is not being measured. The whole reason Channels exists as a
  feature bet is the prompt — but this modal makes the prompt the
  highest-friction option on the surface. Either restructure
  (prompt-first surface, cards as a peek), or instrument the modal
  to capture the path-taken split so the next iteration knows
  whether the prompt is the feature or a feature.

### Stakeholder — TV Engineering Lead
- **Challenge:** `ChannelsWave` runs an infinite `alternate` keyframe
  on every one of 7 slats with `willChange: transform` and 2.4s
  cycle. That's 7 always-on compositor layers behind the modal — on a
  Roku 3 or Fire TV stick that compounds with any focus animation
  in the page beneath. The hover-to-play video card (Upside-down)
  only handles `onMouseEnter`/`onMouseLeave` — no `onFocus` /
  `onBlur` equivalent, so on TV a D-pad user can never trigger the
  video, but the asset still preloads (`preload="auto"`) on every
  modal open. And the modal has no focus management: tab order is
  browser-default, no roving tabindex across the chips and cards, no
  initial focus on the input on open. Open the modal on a TV with a
  D-pad and you can't tell where you are.

## Guest lens findings

### Don Norman — affordances & signifiers
- **Opportunity:** The mic icon is a textbook Norman violation: a
  signifier with no affordance. A glyph that universally means "tap
  to dictate" rendered in the position dictation buttons live, with
  hover state and tooltip wired — that does nothing. A user who
  taps it gets the input focused, which is what tapping anywhere on
  the pill already does. The icon is worse than absent: it actively
  teaches the user the wrong model of the system. Either ship voice
  or remove the glyph. (This is the case study for the new AI rule.)

### Tina Roth Eisenberg — aesthetic editor
- **Opportunity:** The modal is the most *composed* surface in the
  prototype — wave, title, pill, chips, cards stack with real
  rhythm. But two moments break composition: (a) "Or try some of
  these:" is set at 22px semibold, the same weight as a real
  section heading, when it's actually a soft label connecting the
  prompt to the cards. Drop it to micro-tracking-caps and the grid
  speaks for itself. (b) Card descriptions are over-written
  (graduated-rule territory) and the corner badge on each card
  repeats the card's title verbatim. The badge already tells you
  it's "Armchairies"; the description's first words don't need to.
  The composition would tighten if either the badge or the in-card
  title carried the name, not both.

## Convergence
Mateo (graduate + new copy critique), Niyati (graduate + chips-don't-
adapt), Diana (curated-vs-prompt teach reversed), and the Discovery
PM (the prompt is the highest-friction path) converge on a single
read: **the modal is staging the prompt as the headline interaction
while quietly making it the hardest option to take.** The mic that
doesn't work, the chips that don't learn, the input that opens
empty, the curated grid that's labeled as fallback but is actually
the safest path — every detail points the user toward picking a
card, but the project rhetoric says Channels is about the prompt.
Frank's read of the wave being decorative-flux-not-responsive-flux
is the same shape: the modal performs aliveness in places that
don't matter, and stays inert in the places that do.

## Divergence
MDS and Mateo split on the mic icon. MDS reads it as a proportion
problem (two icons fighting one gutter — move or restructure).
Mateo reads it as a Netflix-credibility problem (decoration
masquerading as affordance — remove). Both land on "do something
about the mic" but the *something* differs. The project rule
(AI features ship the loop, not the demo) sides with Mateo: the
mic comes out unless voice ships. If voice does ship, MDS's
restructuring advice applies.

The Frank-vs-rest divergence from prior passes is gone — Frank's
new critique (decorative-flux vs responsive-flux) aligns with the
Mateo/Niyati/PM convergence. The lenses are pointing at the same
surface from different angles for the first time.

## The single biggest opportunity
**Rebuild the modal around the truth that the prompt is the
headline.** Reverse the layout (curated grid on top as a confidence
check, prompt below as the headline), seed the input with the
channel being switched ("Replace 'Action & Adventure' with…"),
make the chips adaptive (one prior-prompt chip per session before
the four canned ones), and either ship the mic or remove it. The
ChannelsWave can become responsive — tilt amplitude growing with
character count — as a stretch move that ties Frank's flux concern
into the headline interaction.

## Next moves
- **Commitment:** Remove the mic icon (apply project rule 2). Seed
  the placeholder with the channel being switched. Drop "Or try
  some of these:" to micro-caps and trust the grid. Down to 2
  columns at every viewport so cards have room for the description.
- **Stretch:** Reverse the modal stack — curated grid first, prompt
  below with a stronger headline; or — alternative direction —
  collapse the curated grid behind a "show me some" button so the
  prompt is the only thing visible by default. Make the
  `ChannelsWave` respond to input length (amplitude maps to
  character count). Implement one adaptive chip slot that surfaces
  the user's last submitted prompt.
