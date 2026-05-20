# Review Lenses for netflix-ideas

The lenses Matt uses to examine each pass of the netflix-ideas prototypes (Channels and Invite). The system has three tiers: anchor lenses that run every pass, guest lenses rotated based on what's being reviewed, and methodology lenses applied weekly or when a methodology question is in play.

The goal is never seven full reviews per pass. Each review surfaces 1–2 high-signal observations per active lens. When multiple lenses converge on the same observation, that's real signal. When they diverge, that's a tension worth naming explicitly.

These are designers and groups whose work Matt is treating as reference material on this project — present-tense, honest about the framing. Not retrospective claims of mentorship.

---

## Default posture: critical, not affirming

The failure mode of design review is polite validation. "This is tight." "Love the motion." "Ships." That posture makes the review cheap and the reviewer invisible.

**Default to critique.** Every lens, every pass, surfaces at least one concrete opportunity — something missing, something too soft, something that could be sharper, something that doesn't yet earn its place. If a lens has no opportunity to offer, that is usually because the reviewer didn't look hard enough, not because the work is done.

Affirmation is the exception, not the baseline. Reserve it for the moment you would defend the choice under pushback — not for the moment the work looks fine. "Fine" is where most work lives, and "fine" deserves the sharpest lens, not the softest.

Keep the voice generous. Critique with respect, specifics, and a path forward. Never personal, never vague, never scolding. The goal is to help the work get to its best possible version, not to perform rigor. If the critique doesn't suggest a direction, it's not yet useful.

**How to read every lens below:** the "what they notice" and "questions they ask" sections are prompts to surface gaps, not a checklist to claim passes. When the work clears a prompt, say why in one sentence and move on. When it doesn't, name the opportunity.

**TV is not a separate lens.** Every lens runs two passes in parallel — TV and (where applicable) the Invite companion phone. The same reviewer holds both viewing angles at once. When a TV critique doesn't translate to the phone surface, name how the phone version works — or flag that the phone model isn't designed yet. When a TV-only issue surfaces (focus invisible at 10ft, motion that breaks the spatial-focus illusion, text under 24pt, a focusable region not reachable via D-pad), surface it inside the lens whose concern it sits closest to: craft lenses notice focus treatment and motion timing; argument lenses notice information density and copy at distance; engineering lenses notice render cost on TV-class hardware and focus-management state machines. If a pass has no TV framing at all on a visual change, "the TV model isn't designed yet" is itself a finding — not a deferral.

**The Couch Test runs on every visual change.** Before any lens fires, walk to the other side of the room (or simulate it — full-screen browser, 6 feet back, browser at 1080p) and ask:
1. Can you tell where focus is in under one second?
2. Can you read the primary text without leaning forward?
3. Does anything important sit in the outer 5% of any edge?

A "no" on any of these is a blocker. Don't pass the work to the lenses until it clears. See `tv-design-primer.md`.

---

## Tier 1 — Anchor lenses (every pass)

### Design craft anchors

#### Frank Chimero
frankchimero.com — primary essay: ["What Screens Want"](https://frankchimero.com/blog/2013/what-screens-want/)

Designer and writer who reads every screen against a first principle: **screens want flux**. The native property of the medium is the capacity for change. Print wants permanence; screens want motion. Frank goes first because his question gates the others: a surface can be restrained, composable, legibly sequenced, and unmistakably Hawkins-flavored, and still fail if it freezes what should breathe. Netflix is the platonic case of his thesis — the entire product is motion, autoplay, sliding rows, focus animations. A static Netflix is a broken Netflix.

What Frank pushes back on in this project:
- Channels rows that present a snapshot when the underlying truth is a stream — a row title typed once, then frozen, when the user's input was meant to be a continuous dialog.
- Loading the AI category response as a single state change ("now it's done") instead of as a process the user can feel happening — the row populating left-to-right, the title resolving on character at a time, the tiles brightening in cascade.
- Empty states designed as a void instead of as a state of attention. An empty channel before the user has spoken is not nothing — it is *a question being asked*. Design it like one.
- Focus that snaps between cards. The transition between focused-A → focused-B is where the medium lives. Skipping that transition treats the screen like a flipbook.
- A row of static posters when the truth is each title has live data underneath (viewer count, decay against trends, novelty score). Where can the row honor its substrate by *moving*?
- The Invite phone surface acting like a document — a centered card, a CTA, a footer — when the truth is the link is a live token that expires, decays, can be revoked, can be re-shared.

Questions Frank asks:
- "What is changing on this Channels row right now, while no one is touching it? If nothing is, is that honest to what's actually happening — the Ranker is constantly re-scoring, novelty is shifting, license windows are closing?"
- "If I left this page open for ten minutes, what would tell me the world had changed?"
- "Where did you design for the snapshot when the truth is a stream?"
- "Did you design the transitions between states, or only the states themselves? Especially: focus-to-focus, prompt-to-result, ungenerated-row-to-populated-row."

#### Josh Mateo
joshmateo.com — worked on Hawkins at Netflix; also Central Design at Spotify.

Mateo is the anchor for whether our Hawkins-flavored layer has a point of view. He believes design systems are infrastructure that scales decisions through brand-product co-authorship. He goes early because if our system reads as a generic dark theme, nothing downstream rescues it.

What Mateo pushes back on:
- A theme that could be re-skinned for HBO Max, Disney+, or Hulu in ten minutes. If our Hawkins-flavored layer doesn't have an irreducible point of view, it isn't doing system work — it's just dark mode.
- One-size-fits-all components. A `<Tile>` that has to work for posters, channels, profiles, and invite cards probably doesn't work for any of them.
- Siloed prototype practice — building one-off styling in the prototypes that should have lived in the theme. If the prototype is teaching the system something, the system should learn.
- Components that work in the hero shot and break in the ugly ones (a long channel title, a missing thumbnail, a 5-year-old genre name).

Questions Mateo asks:
- "What's one detail in this prototype that couldn't exist in any other streaming service's system? If you can't name it, the system has no point of view yet."
- "If I stripped the colors out and used only black, white, and gray, would I still know this was a Netflix-flavored surface? If not, the identity is living in the palette instead of the shapes, the motion, and the rhythm."
- "Where in the prototype did you write one-off styling that should have been a token or a primitive?"
- "Where did you settle when you could have pushed? Show me the thing you almost-did."

#### Niyati Gupta
linkedin.com/in/niygup — Product Design Lead at Netflix; AI × growth × inclusive design.

Gupta is the anchor for whether the AI loop in Channels and the social loop in Invite actually behave like product-grade systems rather than demos. She works on AI as a design material and growth as invitation, both of which are exactly our two prototypes.

What Gupta pushes back on:
- AI features that don't graduate complexity. A prompt input with no path to refine, correct, or undo is a demo. Channels lives or dies on the iteration loop — the third tweak, the fifth, the user who said "more soul" and got the same thing.
- AI as theater. Loading shimmers and ambient particles that say "intelligence is happening" without behaving more intelligently than the prompt before.
- AI voice that sounds like a generic LLM. If the user could tell it was Claude or GPT under the hood, the prompt design isn't done. The AI should sound like Netflix.
- Growth flows that feel transactional. "Get $5 if your friend signs up" reads as a bounty; "your friend will love this thing you love" reads as a gift. The Invite flow needs to read like the second.
- Default-case-user design. A flow that assumes 5G, a recent iPhone, English fluency. The Invite recipient on a 3-year-old Android in a country where Netflix has a different content library.

Questions Gupta asks:
- "Show me the *third* iteration of the Channels prompt. Did you design that loop, or is the prototype only the happy path?"
- "What does the prompt input look like when the user is frustrated? Did you design the recovery, or just the success?"
- "Where in the Invite flow is the design *inviting* rather than *converting*? If the same UI would work for a coupon code, you've designed a coupon code."
- "What does this prototype assume about the user's bandwidth, device age, or language? Where do those assumptions break the experience?"

#### Diana Lu
diana.lu — interface-as-argument; clarity, reduction, teaching.

Diana stays from the Momentum lens set because Channels has a strong teach-the-user dimension — the user has to learn what kinds of utterances produce good rows. If the first interaction doesn't teach them, they never get to the fifth.

What Diana pushes back on:
- Interfaces that present rather than teach. The Channels prompt input that just sits there waiting doesn't help the user learn what to say.
- Affordances that rely on documentation or tooltips. On TV especially — no tooltips exist.
- Surfaces without a narrative arc. First, the user understands they can rename a row. Second, they understand they can describe content in any way. Third, they understand the row updates. Each step needs a visible cue.
- Copy that describes the feature instead of speaking the user's intent. "Customize your channel" describes the feature; "What do you want to watch?" speaks the intent.

Questions Diana asks:
- "A first-time user just landed on Channels. What's the first thing they understand? What's the second? If you can't answer in one sentence each, the sequence isn't designed yet."
- "Which sentence in the copy could you cut without losing meaning? Cut it."
- "Where does the design have to *say* what's possible, instead of *show* what's possible?"

#### Matt D. Smith
mds.is — interaction micro-craft; atomic systems; proportion.

MDS stays from the Momentum set because the prototype lives or dies on micro-details — focus ring weight, card corner radius, motion easing, type rhythm. The TV surface punishes proportion mistakes more than any other surface.

What MDS pushes back on:
- Proportions that are close but not right. Focus ring weight that doesn't relate to card stroke that doesn't relate to row spacing.
- Restraint claimed but not exercised — two near-identical button variants where one would do, decoration masquerading as hierarchy, the same emphasis token applied three times.
- Details that only hold up in the hero. Corner radius, border opacity, focus glow must survive the ugly states — partially-loaded rows, missing thumbnails, the row at the bottom edge of the safe zone.
- Shipping at 80%. "Good enough for now" compounds.

Questions MDS asks:
- "What's the gap between your ideal version of this and what you shipped today? Name it out loud."
- "Which detail would you be embarrassed to defend in a teardown? Fix that first."
- "Where did you reuse a token where you should have introduced a new one? Where did you introduce a new one where you should have reused?"

### Stakeholder anchors

Stakeholders don't praise — they ask what's missing. Run each as a skeptic, not an ally.

#### Hawkins Design Lead (composite)
Cares about: how this prototype talks to the system, where it diverges from Hawkins conventions and why, what the prototype could feed back to the system, how the Material-on-the-inside-Hawkins-on-the-outside architecture holds up.
What they'd challenge: "Where did you fork what should have been a token override? Where did you import @mui/material directly instead of using your Hawkins wrapper? If I asked you to swap MUI for Mantine next week, how much of this code would break?"

#### Discovery / Personalization PM (composite)
Cares about: the business case, the metric this moves, the failure modes, the cost.
What they'd challenge: "If Channels ships, what metric moves? Time-to-watch? Session length? Discovery diversity? What's the per-user-per-month cost of the AI calls, and does the design respect a budget? When the Ranker returns garbage, what does the user see? You designed the success state; design the degradation."

#### Growth / Partnerships PM (composite — for Invite)
Cares about: viral coefficient, conversion, fraud surface, recipient experience, content rights.
What they'd challenge: "What's the conversion path of an invited friend who watches the sample and *doesn't* subscribe? Did you design that exit, or do they fall off a cliff? What stops the inviter from sharing the link publicly? What happens to the link if the inviter changes their mind two days later?"

#### TV Engineering Lead (composite)
Cares about: render performance on TV-class hardware (Roku 3, Fire TV stick, low-end Android TV), focus-management state machine, memory footprint, animation cost, accessibility (voice control, screen reader on TV).
What they'd challenge: "How many tiles does this row hold in memory before virtualization kicks in? What's the focus model when a row is mid-AI-fetch? What happens on a Roku 3 — does the focus animation drop frames? Does this surface respect the system's reduced-motion setting?"

---

## Tier 2 — Guest lenses (rotate based on what shipped)

Each guest lens is here to find a specific failure mode. Pick the one whose failure mode is most likely present in the work.

- **Don Norman** (jnd.org) — affordances, signifiers, user confusion. Best for: any new D-pad interaction, the mic state, the Invite share flow. Pushes back on: hidden state, ambiguous affordances, interactions that violate user expectation, focus that doesn't signal interactability.
- **Rauno Freiberg** (rauno.me) — motion craft. Best for: focus transitions, mic state, row populating animation, QR-reveal motion. Pushes back on: decorative motion, easing that reveals the designer used the default, motion timing wrong for the gesture (focus shouldn't feel like a modal entrance).
- **Paco Coursey** (paco.me) — state machines, web craft. Best for: the Channels AI loop (idle → listening → transcribing → categorizing → fetching → ready → tweak), the Invite flow. Pushes back on: enumerated states missing (error, partial, timed-out, retry, abandoned), keyboard/D-pad paths that weren't walked, transitions that skip an intermediate state.
- **Emil Kowalski** (emilkowal.ski) — animation fundamentals. Best for: focus transitions on TV. Pushes back on: transitions that fight perceived speed, animations on every render, motion that doesn't respect reduced-motion.
- **Tina Roth Eisenberg** (swiss-miss.com) — aesthetic editor, taste. Best for: gut-check on visual sensibility, Figma polish if any handoff happens. Pushes back on: visual noise, decoration not doing work, screens that feel assembled instead of composed.
- **Paul Rand** (paulrand.design) — mark, symbol, reduction. Best for: the Channels mic icon, the Invite share icon, any identity moment. Pushes back on: icons that merely illustrate; identity moments leaning on color instead of form.

---

## Tier 3 — Methodology lenses (weekly or when relevant)

- **The Decision Lab Biases Index** (thedecisionlab.com/biases-index) — cognitive bias audit. Run on the Invite flow especially — there's a lot of social pressure machinery in any sharing feature, and it's easy to slide from "inviting" into "manipulating."
- **IDEO.org** (ideo.org) — equity framing, full-persona-range review. Run when a feature reaches "first pass complete." Most useful for Invite (recipient persona variance is high) and for the Channels prompt input (non-English speakers, users who don't think in genre vocabulary).
- **Warm Design** (warm.design) — accessibility, emotional comfort. Run on any flow involving payments, account sharing, or anything that touches on family/relationship dynamics. The Invite recipient flow — "your friend invited you" — has emotional weight worth handling carefully.
- **Netflix Tech Blog** as a methodology lens (netflixtechblog.com) — evidence rigor. Forces the question: what number moves if this works? What's the cost? What's the failure mode? Run weekly to keep the prototype grounded in product-grade thinking.

---

## How to run a review pass

When Matt says "review the Channels prototype" or "review pass on what I just pushed":

1. Run **The Couch Test** first on any visual change. If it fails, the lenses don't fire yet — fix the blocker.
2. Run all **anchor lenses**. **Each must surface at least one concrete opportunity.** If a lens has nothing to say, the review hasn't been done for that lens; go back and look harder. Don't pad with affirmations.
3. Pick **1–2 guest lenses** based on what shipped — the failure mode most likely present.
4. State **convergence and divergence** explicitly. Converging critique is the priority. Divergent critique is a tension worth naming, not smoothing over.
5. Name **the single biggest opportunity** — the one thing that, if addressed next, would most sharpen the work.
6. Propose the **next two moves**: a commitment (small, must-land) and a stretch (the ambitious thing if the commitment lands easily).

**Calibration check.** Before finalizing the review, scan it once:
- Does the review contain "tight," "ships," "clean," "polished," or "great" without an adjacent concrete reason? Replace that sentence with a critique.
- Is there at least one thing the review asks to change next? If not, the review isn't doing its job.
- Are critiques specific enough that a reader who wasn't there can act on them?
- Did at least one lens speak about TV? If a visual change shipped and no lens named a TV concern, the second pass didn't run — go back and look at the work at 10 feet before sending.

## How to publish a review pass

Each review pass produces a markdown file at `reviews/YYYY-MM-DD-<prototype>-<pass>.md`. Required structure:

```markdown
# Review pass — <prototype> — <pass label>
Date: YYYY-MM-DD
Prototype: Channels | Invite
Pass: first | iteration | final

## What's being reviewed
<one paragraph: the surface, the changes since last pass, the surface area covered>

## The Couch Test
- Focus visible <1s: pass | fail (why)
- Primary text readable without leaning: pass | fail (why)
- Outer 5% clear: pass | fail (why)

## Anchor lens findings
### Frank Chimero
- Opportunity: ...
### Josh Mateo
- Opportunity: ...
### Niyati Gupta
- Opportunity: ...
### Diana Lu
- Opportunity: ...
### Matt D. Smith
- Opportunity: ...
### Stakeholder — Hawkins Lead
- Challenge: ...
### Stakeholder — Discovery PM
- Challenge: ...
### Stakeholder — TV Engineering Lead
- Challenge: ...

## Guest lens findings
### <Guest 1>
- Opportunity: ...
### <Guest 2>
- Opportunity: ...

## Convergence
<where multiple lenses landed on the same thing — this is the signal>

## Divergence
<where lenses pointed in different directions — name the tension>

## The single biggest opportunity
<one sentence, specific, actionable>

## Next moves
- **Commitment:** <small, must-land>
- **Stretch:** <ambitious, conditional>
```

After writing the file, the review is committed and pushed to the repo on a branch named `review/<date>-<prototype>-<pass>`. Open a GitHub issue tagging the prototype: title `Review pass: <prototype> <pass> (YYYY-MM-DD)`, body = a link to the review file plus the "single biggest opportunity" line pulled out as the issue's headline.

This keeps reviews discoverable from the GitHub repo for the writeup, and it forces the review to compose with the codebase rather than living as an external doc.
