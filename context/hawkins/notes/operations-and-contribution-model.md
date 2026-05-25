---
name: Hawkins operations and contribution model
description: Cross-source synthesis of how the Hawkins team actually runs day-to-day — workflow, rituals, contribution gates, and the rituals' cultural underpinnings
type: notes
---

# Hawkins operations and contribution model

> 🤖 *Drafted by Claude (Anthropic) from the source files in `context/hawkins/sources/`, in collaboration with @mattdonovan. Review before treating any synthesis as committed.*

A cross-source read on **how the Hawkins team actually runs**. Pulls from four sources:

- [Schema 2021 talk (Orio + Yee)](../sources/video-schema-2021-guidance-over-governance.md)
- [Wiki Chaves case study](../sources/blog-wikichaves-netflix-design-system.md)
- [Joshua Godi — Netflix Tech Blog 2021](../sources/blog-netflix-techblog-godi-2021.md)
- [Elizabeth Stone — Pragmatic Engineer 2025](../sources/video-pragmatic-engineer-elizabeth-stone-2025.md) *(cultural context, not Hawkins-specific)*

> Why this matters: most public writing about design systems describes the *output* (components, tokens, docs). Hawkins is unusual in how much of its public material describes the *operation* — the cadences, the rituals, the contribution gates. That's the part most replicable as a pattern.

---

## The seven-step operating workflow

From [Chaves]:

```
Backlog → Voting → Roadmap → Design → Engineering → Release → Support
```

- **Backlog** is open; anyone can submit a need.
- **Voting** is a community step — not a manager call. Whose pain matters most.
- **Roadmap** is the team's commitment after voting clarifies signal.
- **Design** and **Engineering** are paired, not sequential — Hawkins designers and engineers work together, not in handoff.
- **Release** triggers documentation, Storybook entries, and the contribution open period.
- **Support** is named as a discrete step — not "and then we maintain it." The team owns the long tail.

What's worth borrowing for any system: **the voting step.** It explicitly converts adoption signal into roadmap commitment. Most design systems collect feedback ad-hoc and let the team decide what to build. Voting forces the team to publish the signal they're acting on.

---

## The rituals (weekly cadence)

From [Orio + Yee] and [Godi]:

| Ritual | Cadence | Who shows up | Purpose |
|---|---|---|---|
| **Design huddles** | Weekly | Hawkins designers + invited product designers | Surface in-progress work, get critique before commit |
| **Engineering stand-ups** | Daily / weekly | Hawkins engineers | Coordination + unblocking |
| **Office hours** | Weekly | Anyone | Drop-in for questions, tour of new features |
| **Quarterly satisfaction polls** | Quarterly | All Hawkins consumers | Measure perceived value, not just adoption |
| **Slack on-call** | Always | Rotating Hawkins team member | Fast response on consumer questions |

The thing that ties these together: **none of them are about gatekeeping.** Every ritual is *outward-facing* — designed to bring product teams *to* the Hawkins team, not to police what product teams do.

---

## The contribution model

From [Orio + Yee] — the part the Schema talk spends real time on:

1. **A product designer needs something Hawkins doesn't have.** They build it locally first (the prototype-driven path).
2. **They propose it back** via Slack, office hours, or the contribution channel.
3. **Hawkins team reviews.** Either pairs with the designer to bring it up to system quality, or accepts as-is, or says "this should live in Outliers" (the parallel library for non-system experiments).
4. **Outliers** is explicitly *not a punishment.* It's a legitimate destination — a place for components that need product validation before promotion.

What this does that's clever: it **removes the binary** "either it's in the system or it doesn't exist." Outliers is the explicit third state. Contrast with most design systems where the contributor either goes through a heavy review or builds in isolation forever.

---

## How the culture makes this run

From [Stone, 2025] and the cultural triangulation in [`projects-and-prompts.md`](./projects-and-prompts.md):

> "Innovation is really driven from within the teams rather than top down." — Stone, ~2025

The operating model above only works because:

- Product designers feel **ownership** of the parts of the product they touch (cultural bottom-up, 2018 → 2025)
- They are **expected to advocate** for their needs against other teams (the "convince another team" mechanic — see `projects-and-prompts.md` P1)
- The Hawkins team's job is **enabling that advocacy**, not deciding what's worth shipping

If you transplant the operating model into a top-down culture, the voting step becomes performative, the office hours go empty, and the contribution model collapses into "submit a PR, wait for review." The rituals are downstream of the culture.

---

## What we steal vs. what we leave

**Steal (for this prototype repo's experiments sandbox + future Hawkins-flavored work):**

- The **voting step as a visible artifact** — make adoption signal a thing you can see in the prototype, not an invisible input
- The **Outliers concept** — a named third state for "experimental, not yet system-grade" components. Our `src/experiments/` registry is already this shape; we should call it that out loud in the README
- The **office-hours ritual as a UI affordance** — most products don't have a "talk to the team" moment inside them. Surprisingly rare.

**Leave:**

- The Slack on-call rotation as a concrete tool — that's a team practice, not a UI pattern
- Specific cadences (quarterly polls, weekly huddles) — meaningful to a real team, irrelevant to a prototype

---

## Open questions

1. **Voting weight** — Chaves describes voting but doesn't say *how* votes are weighted. Equal? Weighted by team size? Weighted by how broken the team is?
2. **Outliers graduation criteria** — what causes a component to move from Outliers into Hawkins proper? Not surfaced in the corpus.
3. **Support load** — how big is the Hawkins team relative to its consumer base? Godi mentions "two teams of six." If consumer base is 80+ Studio apps, that's a heavy support load. Worth digging.
