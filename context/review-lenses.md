# Review Lenses for netflix-ideas

The lenses Matt uses to examine each pass of the netflix-ideas prototypes (Channels and Invite). The system has three tiers: anchor lenses that run every pass, guest lenses rotated based on what's being reviewed, and methodology lenses applied weekly or when a methodology question is in play.

The goal is never seven full reviews per pass. Each review surfaces 1–2 high-signal observations per active lens. When multiple lenses converge on the same observation, that's real signal. When they diverge, that's a tension worth naming explicitly.

These are designers and groups whose work Matt is treating as reference material on this project — present-tense, honest about the framing. Not retrospective claims of mentorship.

**This review is about the product, not the system.** Matt is not building a design system here. He's building two Netflix product prototypes (Channels, Invite). When a lens has a choice between asking a product-design question ("does this serve the user's moment?", "does this surface tell the truth about what's happening underneath?", "would a Netflix viewer feel this?") and a design-system question ("is this token reused correctly?", "should this be a primitive?", "is the component API right?"), it should default to the product question. System concerns appear only where they directly threaten the product experience.

---

## Default posture: critical, not affirming

The failure mode of design review is polite validation. "This is tight." "Love the motion." "Ships." That posture makes the review cheap and the reviewer invisible.

**Default to critique.** Every lens, every pass, surfaces at least one concrete opportunity — something missing, something too soft, something that could be sharper, something that doesn't yet earn its place. If a lens has no opportunity to offer, that is usually because the reviewer didn't look hard enough, not because the work is done.

Affirmation is the exception, not the baseline. Reserve it for the moment you would defend the choice under pushback — not for the moment the work looks fine. "Fine" is where most work lives, and "fine" deserves the sharpest lens, not the softest.

Keep the voice generous. Critique with respect, specifics, and a path forward. Never personal, never vague, never scolding. The goal is to help the work get to its best possible version, not to perform rigor. If the critique doesn't suggest a direction, it's not yet useful.

**How to read every lens below:** the "what they notice" and "questions they ask" sections are prompts to surface gaps, not a checklist to claim passes. When the work clears a prompt, say why in one sentence and move on. When it doesn't, name the opportunity.

**TV is not a separate lens.** Every lens runs two passes in parallel — TV and (where applicable) the Invite companion phone. The same reviewer holds both viewing angles at once. When a TV critique doesn't translate to the phone surface, name how the phone version works — or flag that the phone model isn't designed yet. When a TV-only issue surfaces (focus invisible at 10ft, text under 24pt, a focusable region not reachable via D-pad, motion that breaks the spatial-focus illusion), surface it inside the lens whose concern it sits closest to.

**The Couch Test runs on every visual change.** Before any lens fires, walk to the other side of the room (or simulate it — full-screen browser, 6 feet back, browser at 1080p) and ask:
1. Can you tell where focus is in under one second?
2. Can you read the primary text without leaning forward?
3. Does anything important sit in the outer 5% of any edge?

A "no" on any of these is a blocker. Don't pass the work to the lenses until it clears. See `tv-design-primer.md`.

---

## Tier 1 — Anchor lenses (every pass)

### Product design anchors

#### Frank Chimero
frankchimero.com — primary essay: ["What Screens Want"](https://frankchimero.com/blog/2013/what-screens-want/)

Designer and writer. Frank goes first because his question is the most philosophical and the most generative: **what does this medium actually want to be?** His answer, traced back to Muybridge's 1872 photographs of a horse in motion, is that screens have a grain, and that grain is **flux — the capacity for change**. Not motion as decoration. Not animation as polish. Change as a structural property: things on a screen can become other things, can adapt to context, can respond, can be customized, can hold different content in the same shape, can carry the same content in different shapes. A screen is aesthetically neutral; what it cares about is whether the design honors its appetite for change.

This is the most demanding lens we run, because almost every screen ever designed fails it. Most software treats screens like paper that lights up — fixed compositions, finished thoughts, frozen states. Frank's question is the opposite: where in this product is the design *committed* to the truth that the surface is alive?

Channels is the platonic case for Frank's lens. The whole premise is that a row can become anything the user can describe. The row's existence *is* its capacity for change. So Frank doesn't ask "did you animate the row appearing?" — he asks "does the design make the user feel that this row is a living thing that can keep becoming something else?" If the row reads as a static result with a title pasted on, the design has betrayed the medium.

What Frank pushes back on in this project:
- **Treating the row as a finished object instead of as a continuing conversation.** The user said something; the row appeared; now what? If the row presents as final, the medium's nature is being squandered. The user should feel they can keep shaping it — the screen should look like it's *listening*, not done.
- **Designing the result instead of the becoming.** A row that pops into existence treats the screen like a flipbook. The row coming into being is the interesting half of the design. What does "the row figuring itself out" look like as a state worth dwelling in?
- **Empty states designed as voids.** An empty channel before the user has spoken is not absence. It is a question being held open. The screen's capacity for change is *most present* in the moment before it changes. Design for that potential.
- **The illusion of permanence on a fundamentally impermanent surface.** A row of static posters, a finished title, a fixed thumbnail — when the truth is each title has live data underneath (viewer count, recency, license windows, novelty against the user's history). Where does the design tell that truth?
- **The Invite link presented as a document** — a centered card, a CTA, a footer — when the truth is the link is a token in flux: it expires, it decays, it can be revoked, the recipient can interact with it across days. Where does the design carry that nature instead of hiding it?
- **One-shot interactions.** If a Channels prompt can only be entered once, the design has decided the user's first utterance is their best one. Frank's lens names that as a misunderstanding of what the surface is for.

Questions Frank asks:
- "Where in this product is the design honest about the screen being alive? Not animated — alive. Capable of being different a minute from now, a day from now, a month into the relationship."
- "If I leave this open for ten minutes, what does the surface know about the world that it didn't know when I opened it?"
- "Did you design the becoming, or only the became? The transition between *no row* and *row* is at least as important as either end state. Same for *unrefined* and *refined*."
- "What is this product the day after the user uses it for the tenth time? Did the design plan for that, or only for the first session?"
- "Where did you design a finished thing when the truth is the thing is always in motion?"

#### Josh Mateo
joshmateo.com — Product Design Lead at Netflix (worked on Hawkins); previously Central Design at Spotify.

Mateo is the anchor for *Netflix-grade product judgment*. He has lived inside the Netflix product practice — he's spent years answering the question "what does it feel like when a Netflix surface is doing its job?" That intuition is what we want from him, not a design-system audit. He asks whether the prototype could only live at Netflix — whether the moments it stages feel like Netflix moments, with Netflix's particular sense of confidence, restraint, density, and emotional pull.

What Mateo pushes back on:
- **Generic streaming UI.** If the surface could plausibly be HBO Max, Disney+, or a fan reskin, the product doesn't have a Netflix point of view yet. Netflix's identity lives in rhythm, density, motion timing, the relationship between cards and breath, the confidence of the title treatment — not in red.
- **A surface that doesn't feel like a product, just like an interface.** Netflix is a product because it is opinionated about what to show, when to show it, and how it should feel to navigate. A prototype that hands the user a blank Channels grid and waits has skipped the product layer — Netflix would never present the cold surface; it would always have an opinion about what to put in front of you while you decide.
- **A demo aesthetic.** Helper text on screen, key-cap glyphs along the bottom, debug panels visible in the hero — these are demo conventions, not product conventions. A Netflix surface trusts the viewer to figure out the affordance from the focus state and the content arrangement.
- **Hero-state design.** The mockup that works only when the title is short, the thumbnail is perfect, the data is fresh. Netflix design holds up because it survives a long title, a missing image, an off-week of catalog, an audience for which the recommendation isn't quite right. The prototype must rehearse those.
- **Decoration where Netflix would use restraint.** A Netflix surface is profoundly restrained. If the prototype has more chrome than the Netflix homepage, the design is over-claiming the user's attention.

Questions Mateo asks:
- "What would a Netflix viewer feel in the first three seconds of this surface that they wouldn't feel on any other streaming service?"
- "Show me the ugly version — long title, missing image, AI returns mediocre tags. Does the design still feel like Netflix, or does it collapse?"
- "Where did you let the product be confident instead of helpful? Helpful UI explains; confident UI just works."
- "What did you cut to make the screen feel inevitable? If nothing, you didn't cut enough."

#### Niyati Gupta
linkedin.com/in/niygup — Product Design Lead at Netflix; AI × growth × inclusive design.

Gupta is the anchor for whether the AI loop in Channels and the social loop in Invite actually behave like product-grade systems rather than demos. She works on AI as a design material and growth as invitation, both of which are exactly the two prototypes here.

What Gupta pushes back on:
- **AI features that don't graduate complexity.** A prompt input with no path to refine, correct, or undo is a demo. Channels lives or dies on the iteration loop — the third tweak, the fifth, the user who said "more soul" and got the same thing.
- **AI as theater.** Loading shimmers and ambient particles that say "intelligence is happening" without behaving more intelligently than the prompt before.
- **AI voice that sounds like a generic LLM.** If the user could tell it was Claude or GPT under the hood, the prompt design isn't done. The AI should sound like Netflix.
- **Growth flows that feel transactional.** "Get $5 if your friend signs up" reads as a bounty; "your friend will love this thing you love" reads as a gift. The Invite flow needs to read like the second.
- **Default-case-user design.** A flow that assumes 5G, a recent iPhone, English fluency. The Invite recipient on a 3-year-old Android in a country where Netflix has a different content library.

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
mds.is — interaction micro-craft; proportion; restraint.

MDS stays because the prototype lives or dies on micro-details — focus weight, card proportion, motion timing, the rhythm of one element to another. The TV surface punishes proportion mistakes more than any other surface.

What MDS pushes back on:
- Proportions that are close but not right. Focus treatment weight that doesn't relate to card edge that doesn't relate to row spacing.
- Restraint claimed but not exercised — two near-identical button variants where one would do, decoration masquerading as hierarchy, the same emphasis applied three times.
- Details that only hold up in the hero. Card edges, focus glow, type alignment must survive the ugly states — partially-loaded rows, missing thumbnails, the row at the bottom edge of the safe zone.
- Shipping at 80%. "Good enough for now" compounds.

Questions MDS asks:
- "What's the gap between your ideal version of this and what you shipped today? Name it out loud."
- "Which detail would you be embarrassed to defend in a teardown? Fix that first."
- "Where did you reach for an extra element where the existing one would have carried the moment?"

### Stakeholder anchors

Stakeholders don't praise — they ask what's missing. Run each as a skeptic, not an ally.

#### Discovery / Personalization PM (composite)
Cares about: the business case, the metric this moves, the failure modes, the cost.
What they'd challenge: "If Channels ships, what metric moves? Time-to-watch? Session length? Discovery diversity? What's the per-user-per-month cost of the AI calls, and does the design respect a budget? When the Ranker returns garbage, what does the user see? You designed the success state; design the degradation."

#### Growth / Partnerships PM (composite — for Invite)
Cares about: viral coefficient, conversion, fraud surface, recipient experience, content rights.
What they'd challenge: "What's the conversion path of an invited friend who watches the sample and *doesn't* subscribe? Did you design that exit, or do they fall off a cliff? What stops the inviter from sharing the link publicly? What happens to the link if the inviter changes their mind two days later?"

#### TV Engineering Lead (composite)
Cares about: render performance on TV-class hardware (Roku 3, Fire TV stick, low-end Android TV), focus-management behavior, memory footprint, animation cost, accessibility (voice control, screen reader on TV).
What they'd challenge: "How many tiles does this row hold in memory before virtualization kicks in? What's the focus behavior when a row is mid-AI-fetch? What happens on a Roku 3 — does the focus animation drop frames? Does this surface respect the system's reduced-motion setting?"

---

## Tier 2 — Guest lenses (rotate based on what shipped)

Each guest lens is here to find a specific failure mode. Pick the one whose failure mode is most likely present in the work.

- **Don Norman** (jnd.org) — affordances, signifiers, user confusion. Best for: any new D-pad interaction, the mic state, the Invite share flow. Pushes back on: hidden state, ambiguous affordances, interactions that violate user expectation, focus that doesn't signal interactability.
- **Rauno Freiberg** (rauno.me) — motion craft. Best for: focus transitions, mic state, row populating animation, QR-reveal motion. Pushes back on: decorative motion, easing that reveals the designer used the default, motion timing wrong for the gesture (focus shouldn't feel like a modal entrance).
- **Paco Coursey** (paco.me) — behavioral state, web craft. Best for: the Channels AI loop (idle → listening → transcribing → categorizing → fetching → ready → tweak), the Invite flow. Pushes back on: enumerated states missing (error, partial, timed-out, retry, abandoned), keyboard/D-pad paths that weren't walked, transitions that skip an intermediate state.
- **Emil Kowalski** (emilkowal.ski) — animation fundamentals. Best for: focus transitions on TV. Pushes back on: transitions that fight perceived speed, animations on every render, motion that doesn't respect reduced-motion.
- **Tina Roth Eisenberg** (swiss-miss.com) — aesthetic editor, taste. Best for: gut-check on visual sensibility. Pushes back on: visual noise, decoration not doing work, screens that feel assembled instead of composed.
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
- Did the review default to product questions over system questions? If it reads like a design-system audit (tokens, primitives, component APIs), rewrite it as a product critique — what is the user experiencing, what would a Netflix viewer feel, what is the surface doing or failing to do.

## How to publish a review pass

Each review pass produces a markdown file at `reviews/YYYY-MM-DD-<prototype>-<pass>.md` on `main`. After writing the file, commit and push, then open a GitHub issue titled `Review pass: <prototype> <pass> (YYYY-MM-DD)`. The issue body links to the review file and pulls out the "single biggest opportunity" line as the headline. The issue is the discussion surface; the file is the artifact.

Required file structure:

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

This keeps reviews discoverable from the GitHub repo for the writeup, and it forces the review to compose with the codebase rather than living as an external doc. The companion GitHub issue makes the headline scannable and provides a comment thread for follow-up critique.
