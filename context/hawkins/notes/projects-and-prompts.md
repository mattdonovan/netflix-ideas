---
name: Projects and prompts surfaced from the Hawkins corpus
description: Problems-to-tackle / prototype prompts mined from the source files — a seed list for issues, discussions, or pick-up projects
type: notes
---

# Projects and prompts

> 🤖 *Drafted by Claude (Anthropic) from the source files in `context/hawkins/sources/`, in collaboration with @mattdonovan. Review before treating any entry as committed.*

A working list of **problems we could tackle** or **prototype prompts** surfaced from reading across the Hawkins knowledge base. Each entry is small, scoped, and traceable to at least one source.

The intent: anyone (us, or someone cloning the repo) can open a Discussion or Issue from any of these without having to re-read the corpus to know what's interesting.

> 🌱 Living document. Add as you read. Keep entries short — the source file is the long version.

---

## P1 — The "convince another team" mechanic

**Surfaced from:** [`video-ex-netflix-engineer-2023.md`](../sources/video-ex-netflix-engineer-2023.md)

> "When you're trying to work on a more complex project that needs to have multiple teams involved, then you have to go and convince each of the teams individually as opposed to having a manager tell them 'you need to work with Zach on this project.' Zach has to go and convince them that this project is valuable enough to spend their time on."

**Why it's interesting:** This isn't an abstract culture trait. It's a **designable mechanic.** Most prototypes hand-wave cross-team coordination ("…and then ops approves it"). A Netflix-y prototype that needs another team's buy-in could *show the convincing happening* — a lightweight RFC, a shared doc with comment threads, a Slack thread artifact, a "convince me" button that opens a templated ask.

**Prototype hook:**
- A Channels feature that requires another team's data → user must draft a short pitch, see the receiving team's "we're considering it" state, then get an outcome
- The pitch itself becomes an artifact in the prototype (renderable, shareable)
- Bonus: tie the artifact to the "side effect: built him into a strong communicator" framing from the same video

**Tracking:** not yet an issue. Pick this up first if seeding a Discussion category around "Hawkins-influenced mechanics."

---

## P2 — Bottom-up adoption made visible

**Surfaced from:**
- [`video-netflix-design-careers-2018.md`](../sources/video-netflix-design-careers-2018.md) — "you have the ability to impact any part of the product that you feel passionate about"
- [`video-ex-netflix-engineer-2023.md`](../sources/video-ex-netflix-engineer-2023.md) — bottom-up vs. top-down at FB/Airbnb
- [`video-pragmatic-engineer-elizabeth-stone-2025.md`](../sources/video-pragmatic-engineer-elizabeth-stone-2025.md) — "innovation is really driven from within the teams rather than top down"

**Why it's interesting:** Same value, three sources, seven years apart. Hawkins's "guidance over governance" frame is *downstream* of this. A prototype that wants to feel Netflix-y should put the user in the seat where they're choosing what to work on, not being assigned.

**Prototype hook:**
- A "pick what to ship next" surface where the user chooses from a portfolio of candidate features (not a queue)
- Show the cost/benefit, the open questions, the team you'd need to convince → ties into P1
- The opposite of a Jira backlog

---

## P3 — Validation-lag as a first-class state

**Surfaced from:**
- [`blog-netflix-techblog-godi-2021.md`](../sources/blog-netflix-techblog-godi-2021.md) — Joshua Godi's stated regret: shipping components before stress-testing in real product context
- [`blog-princepal-2025.md`](../sources/blog-princepal-2025.md) — "validating new components before shipping them out broadly"

**Why it's interesting:** Most design systems show components in two states: "in development" or "shipped." Hawkins's lesson is that there's a real third state — **"shipped but not yet validated in product context."** Treating that as a first-class state (with a different visual treatment, expiry, or follow-up gate) would be a small, opinionated build.

**Prototype hook:**
- A component card that visibly carries its "validation status" — last seen in product X days ago, here's the screenshot, here's whether anything broke
- Optional: auto-degrade visual status if no product has consumed it within N weeks
- Lives inside the experiments sandbox

---

## P4 — "Convince me" as a generic UI primitive

**Surfaced from:** synthesis of P1 + the Schema 2021 contribution-model section

**Why it's interesting:** P1 names the mechanic. P4 is the question: *what is the smallest, most reusable UI primitive that captures "I have an ask, here's why, here's what I need from you"?* A textarea + an outcome state isn't enough. The Hawkins team's contribution model (designers submit, system team reviews, optional pairing) is one variant. Linear's project intake is another. A prototype-grade primitive could combine them.

**Prototype hook:**
- An MUI-based "Convince" component: title, ask, context, asks-of-other-team, single CTA
- Renders the same in three contexts: cross-team feature ask, design-system contribution, "I want this on the roadmap"
- Demonstrates the bottom-up culture in a single reusable shape

---

## P5 — Make the "two flavors" structural, not theoretical

**Surfaced from:**
- [`video-schema-2021-guidance-over-governance.md`](../sources/video-schema-2021-guidance-over-governance.md) — Consumer + Professional flavors share tokens/assets, diverge in components
- [`blog-princepal-2025.md`](../sources/blog-princepal-2025.md) — "Two paths, one spine"

**Why it's interesting:** A lot of design systems claim to support multiple product surfaces, but the seam between "shared tokens" and "diverged components" is rarely shown. Hawkins's split (Consumer vs. Professional) is a real-world case. A prototype could explicitly demonstrate the seam: same token, two component renderings, side-by-side.

**Prototype hook:**
- A page that shows a single design token (e.g. brand red) → consumed by both a Consumer-flavored card and a Professional-flavored table row
- Toggle the token, watch both change
- Toggle the component variant, watch one change while the other holds

---

## Pattern bank (not yet projects)

Smaller observations from the corpus that don't merit a full prototype yet but are worth holding:

- **Quarterly polls** (Schema 2021) — Hawkins team polls users on satisfaction. Could ports to a self-evaluating prototype.
- **Office hours** as a UI surface (Schema 2021) — most products don't have a "talk to the team" moment in the product itself.
- **"Designer-as-strategic-partner"** (2018 reel) — could prototype as a designer sitting next to a stakeholder in a shared canvas, not handing off a file.
- **The Keeper Test** (Stone 2025) — uncomfortable to prototype, but the *information environment* it requires (you know where you stand) is interesting.

---

## How to add to this file

1. Read a source.
2. Find a phrase, claim, or observation that's *designable* — i.e. could become a small prototype, a Discussion prompt, or a GitHub issue.
3. Add a new section with: source link, the quote, why it's interesting, and a prototype hook.
4. Don't fill out a tracking row until someone actually picks it up.
