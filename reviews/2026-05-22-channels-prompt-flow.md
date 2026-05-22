# Review pass — Channels — prompt-flow + scramble
Date: 2026-05-22
Prototype: Channels
Pass: iteration

## What's being reviewed
Second iteration on the same day. The free-text prompt input now actually
calls Claude (Haiku) to reformat the user's utterance into a 3–5 word row
title via `summarizePromptToTitle`. While that call is in flight, the row
title cycles through 5–6 randomly-picked "thinking" messages from a bank of
20 (`Mind-melding`, `Popping popcorn`, `Reticulating splines`, …) every
1.1s, with a per-character left-to-right scramble animation on each change.
A `MIN_THINKING_MS` floor (6500ms) guarantees the cycle plays long enough
to be seen even when Haiku returns in 1–2s. After the AI title lands the
row holds 800ms then flips to the existing End-of-Prototype card. Adjacent
changes: hero title + channel-bars icon collapse inline at `xs`; the
SwitchChannels modal textarea now truncates its placeholder with ellipsis
on mobile instead of wrapping into the pill's clipped second line.

Critical context: the 2026-05-22-channels-switch-flow review's headline
finding — "the End-of-Prototype card is the wrong terminus; replace it
with a designed next-step" — is **not addressed in this pass**. What
landed instead is more theater *in front of* the same terminus.

## The Couch Test
At 1080p, full-screen browser, ~6ft back.
- **Focus visible <1s**: pass.
- **Primary text readable without leaning**: pass on TV breakpoints; the
  mobile hero title (20px) is intentionally smaller and not in scope.
- **Outer 5% clear**: still fail-ish — TV-NERD chip is still pinned flush
  to `right: 0`. Unchanged from prior pass; carried.

## Anchor lens findings

### Frank Chimero
- **Opportunity:** The scramble + cycling messages is the most honest
  "designing the becoming" move this prototype has shipped. For 6.5
  seconds the row is *visibly alive* — characters flicker, messages
  change, the icon spins, the title arrives glyph-by-glyph. The medium's
  appetite for change is finally being fed. **But the becoming still
  terminates in the End card.** The row is alive for 7s and dead at 8 —
  the design has learned to honor flux only as a prelude to a fixed
  terminus, not as a structural property of the surface. Frank's question:
  can the same "alive" treatment extend *past* the title landing, instead
  of being a 7-second prologue to a wall? The scramble proves the team
  can design becoming; the end state proves they still believe in
  end states.

### Josh Mateo
- **Opportunity (1):** Netflix would not install a mandatory 6.5s delay on
  any user action. Netflix's posture is confident speed — search returns
  instantly, hover-previews start in <300ms, every transition is paced to
  feel like the product is *ahead* of you. The `MIN_THINKING_MS` floor
  inverts that posture: it says "the AI returned in 1.5s but we are going
  to make you watch the animation finish." A Netflix surface trusts that
  fast = good. This surface is teaching the user that AI is slow theater.
- **Opportunity (2):** The loading-message bank is too charming.
  "Mind-melding", "Popping popcorn", "Reticulating splines",
  "Whispering to ranker" — these are *designer* voice, not Netflix voice.
  Netflix's loading copy is either silent or one word ("Loading",
  "Searching"). The current set reads as a creative-writing exercise
  printed on the product. Cut the cuteness. Keep one or two evocative
  options ("Reading the room", "Calibrating mood") and let the rest be
  blank — confidence over commentary.

### Niyati Gupta
- **Opportunity:** The AI call is now real, which is real progress. The
  third-iteration loop, the prompt history, the "more soul" path — still
  not designed. Worse, this pass *codified* AI-as-theater by adding a
  guaranteed minimum delay to the flow. The lens warned about AI-as-
  theater on 2026-05-20 and again on 2026-05-22 (morning); this pass
  shipped exactly what was warned against, dressed up as "letting the
  animation breathe." If Haiku returns in 1.5s, the truth of the system
  is "AI is fast"; the design is telling a different truth on purpose.
  That's not "designing the iteration loop" — it's slowing the demo so
  the design feels heavier than the model.

### Diana Lu
- **Opportunity:** The cycling messages tell the user *something is
  happening* but not *what they can type*. A first-time user who types
  "asdf" into the prompt input gets the same 6.5s scramble theater as a
  user who typed a careful description. The teach about prompt quality —
  the central thing that determines whether Channels works at all — is
  still missing. Consider: while the messages cycle, surface a faint
  "you said: <prompt>" line so the user sees their own input being
  worked on, and learns that the input is the thing that matters.

### Matt D. Smith
- **Opportunity (1):** ScrambleText's per-character resolution threshold
  is linear (`(i+1)/(len+1)`). On long final titles the tail-end
  characters resolve later and the scramble lingers visibly on the right
  side of the word; on short titles the whole reveal feels uniform.
  A `min(durationMs, baseMs + len * perCharMs)` scaling would make the
  motion feel proportional to content. Right now the animation feels
  like one shape applied to two different lengths.
- **Opportunity (2):** The loading-message titles ("Whispering to ranker",
  "Asking the algorithm") are wider than most channel titles. When the
  cycle hits a long message after a short one, the title-bar baseline
  doesn't shift but the leading-icon-to-title gap reads inconsistently
  because the title runs into the hoverHint zone. A `min-width` reservation
  on the title or capping message length to <= 16 chars would steady it.

### Stakeholder — Discovery PM
- **Challenge:** This pass moves zero new metrics and *adds* 4.5+ seconds
  of mandatory wait time to every prompt submission. The user-perceived
  product is now: type → 7s theater → End card → reset → original row →
  repeat. The previous pass at least failed in 3s. The Haiku API call
  is now real cost (per-user-per-month) and the user-perceived value is
  still zero. The single most expensive line of code shipped this pass
  is `const MIN_THINKING_MS = 6500`. What metric does that buy?

### Stakeholder — TV Engineering Lead
- **Challenge:** `ScrambleText` runs a `requestAnimationFrame` loop for
  ~600ms on each title change. In the cycling phase that's ~6 rAF loops
  in 6.5s, each producing a `setState` every frame (60fps × 600ms ≈ 36
  state updates per scramble × 6 scrambles ≈ 216 React re-renders of the
  row title per submission). On TV-class hardware (Roku 3, Fire TV stick)
  this stacks with focus animation and the existing skeleton shimmer (a
  CSS animation × 12 tiles already running). No
  `prefers-reduced-motion` short-circuit. Also: the `Promise.all`
  scheduler captures `setRowOverrides` and `cycleTimersRef` but has no
  unmount-abort signal — if the user leaves the page mid-flow, the
  state-update fires after unmount (React will warn, no crash, but the
  intent is unclean).

## Guest lens findings

### Paco Coursey — behavioral state
- **Opportunity:** The state graph gained a new edge (prompt-source) and
  a new failure mode (AI rejects). The rejection path *exists* — the
  client falls back to `mockSummarize` silently — but the user gets no
  signal. Worse, the rejection still waits 6.5s before resolving because
  the `Promise.all` couples the AI call to the min-delay timer. A user
  whose Haiku key is dead now waits the same 6.5s as a user with a
  working key, then gets a mock title that doesn't reflect their prompt.
  The error edge is in the code but not in the design — which means it
  doesn't actually exist as far as the user is concerned. Other missing
  edges: re-entry to the Switch modal while a prompt is in flight,
  cancelling a prompt mid-cycle, prompt while another row is mid-prompt.

### Rauno Freiberg — motion craft
- **Opportunity:** The scramble animation does not know anything about
  its content. The same threshold curve, character set, and duration play
  for "Mind-melding" (12 chars, cute) and "Soft 2010s nostalgia" (20
  chars, final answer). Motion craft asks the animation to *carry the
  meaning of the moment*: the cycling-message scrambles should feel
  searching (faster, jitterier, less character variety), and the
  final-title scramble should feel arrived (slower, more decisive, maybe
  a tiny settle at the end). Right now both scrambles are the same shape
  played at different intervals, which reads as one effect rather than a
  state graph.

## Convergence
Mateo, Niyati, and the Discovery PM converge on a single critique:
**the 6.5s mandatory delay is theater.** Mateo reads it as anti-Netflix
posture (Netflix is fast). Niyati reads it as the AI-as-theater anti-
pattern the lens has flagged twice. The PM reads it as a cost line with
no metric attached. Three lenses, one line of code (`MIN_THINKING_MS =
6500`), one decision to revisit. Add Paco's read of the same constant
masking error states, and that's four lenses on the same number.

## Divergence
Frank Chimero applauds the scramble as the prototype's first real
honoring of the medium's flux. MDS and Mateo critique the same animation
as decoration that doesn't carry meaning specific to its content. The
lenses pull opposite directions: Frank wants *more* of this kind of
becoming spread through the rest of the surface; Mateo wants Netflix-
restraint applied to remove the cuteness. The tension is real and worth
sitting with — the scramble is genuinely a step forward for one lens and
a step into demo aesthetics for another. The likely resolution: keep the
*becoming* (the scramble exists for a reason — the row is being figured
out in real time), tighten the *theater* (no mandatory floor, fewer cute
messages, motion that knows what state it's in).

## The single biggest opportunity
**Replace the 6.5s mandatory floor with a 1.5–2s floor tied to the AI's
actual latency, and let the scramble play once per real state change.**
The user should see ~1 cycling message + the final title — enough for
the animation to register as intent, short enough not to feel staged. Pair
it with a `prefers-reduced-motion` short-circuit that skips the scramble
entirely and renders the final title instantly. This converts a 7-second
performance into a 2-second sign-of-life, and stops the design from
contradicting the truth of how fast the model actually is.

## Next moves
- **Commitment:** Drop `MIN_THINKING_MS` from 6500 to 1800. Trim
  `LOADING_MESSAGES` from 20 to 5, weighted toward Netflix-voice
  ("Reading the room", "Calibrating mood", "Searching"). Add a
  `prefers-reduced-motion` short-circuit that renders the final title
  with no scramble. Surface the user's original prompt in 12px under
  the cycling title so the teach lens has something to point at.
- **Stretch:** Land the 2026-05-22-channels-switch-flow commitment that
  this pass skipped: replace the End-of-Prototype card with a
  "Refine your channel" tile that re-opens the Switch modal with the
  prior prompt pre-filled. The scramble animation already exists; pointing
  it at a refine state instead of a terminus converts theater into a
  real iteration loop.
