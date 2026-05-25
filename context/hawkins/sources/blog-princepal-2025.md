---
title: "Hawkins at Netflix: A Design System That Grows With the Product"
author: "Prince Pal"
author_role: "Independent SaaS product designer (NOT a Netflix employee — secondary source synthesizing Joshua Godi's Netflix Tech Blog post and the Schema 2021 talk)"
url: "https://princepaluiux.com/blog/hawkins-netflix-design-system/"
source_type: "blog"
source_tier: "secondary"
accessed: "2026-05-24"
publication_date: "2025-08-05"
license: "© Prince Pal, princepaluiux.com. Treat as quote-with-attribution. Note: this is secondary literature — verify every Hawkins claim against the primary sources (Godi 2021 / Orio + Yee 2021)."
covers:
  - hawkins-philosophy
  - guidance-vs-governance
  - layered-fallback-model
  - validation-lag
  - platform-agnostic-future
quoted_in: []
---

# Prince Pal — Hawkins at Netflix: A Design System That Grows With the Product

**Author:** Prince Pal (independent SaaS product designer; not affiliated with Netflix)
**Published:** 2025-08-05
**Type:** Secondary synthesis / opinion piece
**Source:** https://princepaluiux.com/blog/hawkins-netflix-design-system/

> ⚠️ **Secondary source.** Prince Pal is not on the Hawkins team. This piece synthesizes the Joshua Godi Tech Blog post and the Schema 2021 Orio + Yee talk, adds his own commentary, and is dated 4+ years after the primary sources. Treat factual claims as already-known if they trace back to primaries; treat opinion sections (e.g. "Components vs. Connections") as Prince Pal, not Netflix.

## What's new vs. the primaries

Almost nothing factual is new. The value of this piece is:
1. **A clean retelling** in approachable prose, useful as a primer to point new designers at.
2. **The layered fallback model articulated verbatim** — already in our `hawkins-research.md` synthesis, but Pal's version is well-phrased:
   > "If you're designing something new, start with Hawkins components. If that doesn't work, use Hawkins tokens to at least match the feel. And if you're doing something that feels truly custom, talk to the team. That way, they can learn, adapt, maybe even evolve the system."
3. **A few opinion frames** (NOT Netflix's position):
   - **"Components vs. Connections"** — "Building components is overrated... A well-documented button won't fix misalignment. A shared understanding might."
   - **"Don't blindly mimic Google's Material or Apple's HIG"** — frames it as platform-vs-product distinction. (Already in our synthesis as a Hawkins-attributed warning; Pal restates it.)
   - **Speculation on future direction**: platform-agnostic / responsive across input types (touch, remote, mouse), screen sizes, orientation. NOT sourced — this is his projection.

## Confirmations of existing claims

- Two flavors: Professional started first, Consumer grew sideways
- Stack: Figma + Storybook + Hawkins API + custom plugins
- Rituals: weekly syncs, eng stand-ups, design huddles, office hours, Slack
- Adoption is the most-tracked metric; engagement/contribution/satisfaction still developing
- Validation-lag was a stated mistake (components shipped before real-world stress test)

## Quote bank (Prince Pal's framings — attribute carefully)

> "Hawkins wasn't born as a grand, top-down initiative with big announcements and neatly labeled folders. Like many good things in tech, it started quietly — almost as a whisper — on the Professional side of Netflix." — Pal

> "Two paths, one spine. Both share the same design DNA through tokens, assets, icons, illustrations — small but mighty elements that help everything feel… Netflix-y, even when the context shifts wildly." — Pal

> "The idea is not to shut down innovation — but to give it a framework. One that flexes, but doesn't snap." — Pal (framing Hawkins's fallback model)

> "Rigid systems break. Hawkins bends." — Pal

> "If they could rewind and change something, it would probably be this: validating new components before shipping them out broadly." — Pal (paraphrasing Hawkins team's stated regret)

> "Building components is overrated... The magic happens in the relationships — between designers, between teams, between vision and reality." — Pal (his own thesis)

> "Don't blindly mimic Google's Material or Apple's HIG. They're fantastic resources — no doubt. But they're designed for platforms, not products. Netflix is a product. Your team probably is, too." — Pal

> "No one has it figured out. Seriously. No one. Even the slickest-looking systems — the ones getting claps on LinkedIn — have their cracks behind the scenes." — Pal

## Outbound references of note

- Embeds the Schema 2021 video (https://www.youtube.com/watch?v=nFe6US9aA_U)
- Image: "Foundational elements can be composed together to bring a particular intent to a customer."
- Image: "Guidance over governance" (lifted from the Schema talk)
- Image: "A Figma plugin that helps designers connect to the Netflix Catalogue and swap language efficiently." (this is Moria)
- Post view count at fetch: 2,812
