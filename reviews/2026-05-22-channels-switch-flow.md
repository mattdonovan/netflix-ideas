# Review pass — Channels — switch-flow + scaffolding
Date: 2026-05-22
Prototype: Channels
Pass: iteration

## What's being reviewed
The Channels surface after a substantial scaffolding pass on top of the
2026-05-20 iteration. New surface area: a "Who's watching?" landing screen
that fans out to Channels / Idea Hopper / Matt; a Switch Channels modal that
accepts curated picks and free-text prompts; a row-override state machine
(`loading` → `ended`) that replaces the original row with skeleton tiles for
~3s and then surfaces an "End of Prototype" card in slot 0; the
end-of-prototype modal; a Prototype Info modal written in Matt's voice; a
rewritten hero (Switch Channels wordmark, channel-bars glyph, channel-
surfing video, hover-to-play + click-to-toggle, top fade for nav legibility,
viewport-flush TV-NERD chip); a Detail modal and an Idea Hopper modal.
Underlying primitives (Row, TopTenRow, Tile, focus engine, tokens) were also
expanded.

This pass closes one ticket from 2026-05-20 — the row now *does* something
visible when switched — but introduces several new product decisions worth
holding up to the lenses.

## The Couch Test
At 1080p, full-screen browser, ~6ft back.
- **Focus visible <1s**: pass. Card-pop carries; hero CTAs are unambiguous.
- **Primary text readable without leaning**: pass on hero title, row titles,
  modal headers. Fail on the End-of-Prototype card's badge — 10px,
  uppercase, against a photo. At distance it reads as a generic chip, not as
  the sentence "this is the end."
- **Outer 5% clear**: fail-ish. The TV-NERD chip is *intentionally* pinned
  to `right: 0`, butting the viewport edge. On a TV that's the cutoff zone
  Netflix never uses. The web framing makes this defensible, but flag it.

## Anchor lens findings

### Frank Chimero
- **Opportunity:** The switch flow finally designs *some* of the becoming —
  the row's identity changes, the bars-icon spins, the tiles shimmer. But
  after 3 seconds the design quietly concedes the medium: the row presents
  an End-of-Prototype card and the becoming stops. The screen stops
  listening. Worse, "End of Prototype" is a *fourth-wall break disguised as
  a tile* — the surface dropped its capacity-for-change to tell the user
  there is no more change. Frank's question: is there a version of this end
  state that *still feels alive*? An empty row that holds the prompt back
  to the user ("you asked for X — try Y next?") would honor the medium
  where the current end card abandons it.

### Josh Mateo
- **Opportunity:** Netflix would never show an "End of Prototype" card. The
  product fiction is broken twice in one click — once by the badge, once by
  the modal that follows. The same surface that just earned credibility
  through the hero, the rows, the badges, the footer, the avatar menu, the
  shimmer — surrenders it the moment the user actually engages the
  prototype's one real interaction. Either commit to the fiction (a "we
  couldn't find anything for that" Netflix-styled empty state, recoverable)
  or commit to the meta-frame (the entire surface is openly a prototype, and
  the End card is consistent with that). Right now the surface speaks
  Netflix for 95% of the experience and a designer's apology for the last 5%.

### Niyati Gupta
- **Opportunity:** The free-text prompt input now does *something*, which is
  progress. But the loop the user can actually run is: type → 3s wait →
  End card → reset → original row → repeat. There is no path to refine, no
  memory of the previous prompt, no acknowledgement that the user already
  said "more soul." The third iteration the lens asked about on 2026-05-20
  is still not designed. What landed instead is the *first* iteration with
  more theater around it. Worse, the 3s loading is fixed and unrelated to
  anything actually happening; it is loading *as theater* — the exact thing
  the lens warned against last pass.

### Diana Lu
- **Opportunity:** A first-time user lands on the home picker. The three
  tiles are unlabeled beyond "Channels / Idea Hopper / Matt." Nothing on the
  picker tells the user that Channels is the built thing and the others are
  not — they have to discover that by clicking. Then they land in Channels
  and the load-bearing affordance is the row title (clickable to switch).
  Nothing teaches that. The teach is still missing — it just moved one
  surface up. A one-line subtitle under "Netflix Ideas" ("one prototype, one
  parking lot, one me") would do more work than the picker's current
  cleanliness.

### Matt D. Smith
- **Opportunity (1):** The End-of-Prototype card sits inside a row of
  shimmering skeletons. Its proportion matches them, but its *visual weight*
  doesn't — full-bleed photo + dark gradient + bright white badge against
  6 grey rectangles. The first slot screams while the rest whisper. Either
  drop the End card's contrast (make it feel like a tile, with the badge
  inset and muted) or let it occupy the whole row when it appears (the
  skeletons in slots 2–12 are doing no work once the End card lands).
- **Opportunity (2):** The hero's `clamp()` typography reads correctly at
  most widths, but the "Switch Channels" h1 (clamp 40–88px, weight bold,
  letter-spacing -0.02em) sits on top of a busy video frame with only a
  text-shadow for legibility. At the smaller end of the clamp the title
  collides with the video's high-frequency channel-surf static. The
  underlying left-to-right gradient does most of the legibility work; the
  text-shadow is decorative. Consider a stronger gradient stop under the
  title region or a contained scrim instead of a global one.
- **Opportunity (3):** The TV-NERD chip claims to be a Netflix maturity-
  badge nod, but Netflix's chip is inset from the right edge, not flush. The
  flush placement reads as a layout bug at first glance (the user's eye
  tries to follow the white left-border up to a column that isn't there).
  The micro-detail betrays the homage.

### Stakeholder — Discovery PM
- **Challenge:** This pass moves zero metrics that weren't already moved by
  the last one. The user can now *type* a prompt instead of picking from a
  list — but both paths land at the same End card 3 seconds later. The
  product cost (LLM calls, ranker integration, content licensing for cross-
  catalog re-categorization) is unchanged; the user-perceived value is also
  unchanged. If this were a sprint review, the question would be: what is
  the metric this pass moved? "Made the prompt input live" isn't a metric.
  Plan the *second* prompt, the third, or the path back to a working
  recommendation that the user can actually save.

### Stakeholder — TV Engineering Lead (web-perf proxy)
- **Challenge:** The hero now ships an 8.4MB MP4 that auto-plays on hover
  and continues forever. On a flaky connection the video stalls at the first
  frame, and the click-to-toggle behavior becomes a wager about whether the
  user is pausing a live video or trying to play one that never loaded.
  There is no fallback poster, no `loadedmetadata` guard around the play
  promise besides a `.catch(() => {})`, and no awareness of the user's
  `prefers-reduced-motion`. Also: the Idea Hopper picker tile's hue-cycle
  animation runs on hover, which is fine, but the same animation triggers
  via `.picker-tile:hover .row-title-icon path` — every path runs an
  infinite keyframe with no `will-change` and no shutoff condition once the
  cursor leaves. Cheap, but compounds with the video.

## Guest lens findings

### Don Norman — affordances & signifiers
- **Opportunity:** The hero's click-to-toggle-video is *entirely hidden
  state*. No cursor change beyond the default pointer, no play/pause glyph,
  no signifier that the video is interactive. A user who clicks the hero
  expecting to navigate is rewarded with the video pausing — which they
  will read as a bug. Either surface a play/pause overlay on hover or
  remove the click-toggle. The hover-to-play autostart is its own Norman
  problem (the user did not request playback) but at least it's reversible.

### Paco Coursey — behavioral state
- **Opportunity:** The override state machine has two phases (`loading`,
  `ended`) and three transition surfaces (curated pick, free-text prompt,
  skeleton/end click). The graph is missing: error (Claude unreachable),
  empty (no matches for prompt), timeout (3s elapsed with no result),
  re-entry (user opens the Switch modal again on a row that's already in
  `ended`). The current code treats `ended` as terminal; the modal opens,
  the row resets to original content, and the user is back at square one.
  None of those edges is designed. The state diagram still has a happy path
  and a deliberate cul-de-sac, but no real product graph.

## Convergence
Frank, Mateo, Niyati, and Paco converge on the same load-bearing critique
from four angles: **the End-of-Prototype card is the wrong terminus.** Frank
reads it as the design abandoning the medium's promise. Mateo reads it as a
fourth-wall break that costs the Netflix credibility just earned. Niyati
reads it as a fake loop that simulates iteration without designing it. Paco
reads it as a state graph with one node and no real edges. Four lenses, one
decision: the row's `ended` phase is doing work that the design hasn't
earned the right to do.

## Divergence
MDS wants the End card to read as a more proportionate tile inside the row
(quieter badge, less photo contrast). Mateo wants there to *be no End card
at all*, because Netflix wouldn't ship one. These pull opposite directions
— refine the existing card vs. delete the existing card. The tension is
real: the End card is honest about the prototype's scope, which the picker
home already signals; but it is also the moment that breaks the fiction the
rest of the surface invests in. Worth picking a side instead of splitting it.

## The single biggest opportunity
**Replace the End-of-Prototype card with a designed *next-step* — a return
of the prompt itself, recoverable.** When the 3s elapses, the first slot
should hold the user's prompt back to them (e.g. "you asked for: shows my
dad would secretly love → try refining: …") with a one-tap path to amend
the prompt and rerun. That single move converts the four converging
critiques into a single design and finally lets the iteration loop the
prototype is supposedly about become visible on the surface.

## Next moves
- **Commitment:** Strip the "End of Prototype" badge and modal from the
  switch flow. Replace the first-slot card with a quiet "Refine your
  channel" tile that re-opens the Switch modal with the previous prompt
  pre-filled, and have the skeletons in slots 2–12 fade rather than
  shimmer forever. This is the minimum viable iteration loop and closes
  the Frank / Mateo / Niyati / Paco convergence.
- **Stretch:** Real prompt history. The Switch modal opens with a list of
  the user's prior prompts for this row as editable chips; selecting one
  edits it inline; submitting branches a new override. Store history per
  channel id. This is the design the 2026-05-20 review asked for and that
  this pass did not yet deliver.
