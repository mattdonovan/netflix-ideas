# Hawkins, the slow read — a primer for new product designers

> 🤖 **Drafted by Claude (Anthropic) in collaboration with [@mattdonovan](https://github.com/mattdonovan).** Built from a public-sources knowledge base maintained in this repo; every claim is traceable to a source file under [`context/hawkins/sources/`](https://github.com/mattdonovan/netflix-ideas/tree/main/context/hawkins/sources). Reviewed and edited by Matt before posting.

You just joined Netflix Design. Someone said "use Hawkins," nobody handed you a manual, and the internal docs assume you already know what you're looking for. This post is the **slow read** — the version of Hawkins you'd get if a colleague sat down with you for an hour and walked you through it from the outside in.

It's written from a public-sources knowledge base maintained in this repo at [`context/hawkins/`](https://github.com/mattdonovan/netflix-ideas/tree/main/context/hawkins). Every claim is traceable to a source file. If you spot something wrong, **please reply** — corrections are the whole point.

> 👋 **Who is this for?** A product designer (or PM, or engineer) joining Netflix and trying to build a mental model of Hawkins fast. Or anyone outside Netflix who wants a citable map of what's actually known publicly.

---

## The 90-second version

- **Hawkins is two design systems sharing one spine.** *Consumer* (the streaming app you know) and *Professional* (Studio + ops tools). Same tokens, divergent components.
- **It's built on Material-UI underneath, but you can't tell.** Hawkins wraps MUI so consumers never touch a MUI prop. That lets the team swap MUI later without breaking the world.
- **The team's stance is "guidance over governance."** Three tiers: use a component → use the tokens → talk to the team. The third tier is the system admitting it's incomplete, not the user breaking the rules.
- **Bottom-up culture is the foundation.** Adoption is earned, not mandated. The "convince another team" mechanic comes up in every cultural source we have.
- **The system is operated like a product.** Quarterly polls, office hours, Slack on-call, weekly design huddles. Not a static deliverable.

---

## The timeline

Same themes recur across seven years of public sources, viewed from very different vantage points. That recurrence is the strongest signal we have that what's written about Hawkins is real, not just rhetoric.

| Year | Source | What it tells us |
|---|---|---|
| ~2018 | [Netflix design careers reel](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/video-netflix-design-careers-2018.md) | Designers already framed as strategic partners — pre-dates the Hawkins talks by 3 years |
| 2021-02 | [Joshua Godi — Tech Blog](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/blog-netflix-techblog-godi-2021.md) | Build-vs-buy (MUI), Storybook, the 4-pronged adoption playbook |
| 2021 | [Orio + Yee — Schema talk](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/video-schema-2021-guidance-over-governance.md) | "Guidance over governance" vocabulary; Consumer + Professional split; Moria + Figmagic |
| 2020–22 | [Wiki Chaves — case study](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/blog-wikichaves-netflix-design-system.md) | The 7-step ops workflow: Backlog → Voting → Roadmap → Design → Eng → Release → Support |
| ~2023 | [Ex-Netflix engineer](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/video-ex-netflix-engineer-2023.md) | Top-of-personal-market comp + the "convince another team" mechanic |
| 2025-08 | [Prince Pal — synthesis blog](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/blog-princepal-2025.md) | Secondary retelling; useful as a primer to share around |
| ~2025 | [Elizabeth Stone (CTO) — Pragmatic Engineer](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/sources/video-pragmatic-engineer-elizabeth-stone-2025.md) | "Innovation from within the teams rather than top down" — same culture, 7 years on |

---

## What surprised me

A few things that don't show up if you only skim the headline talks:

1. **The "convince another team" mechanic is real and described identically by three different people.** It's not just a culture line. It's an operating constraint — every cross-team feature has to be sold to the team you need. Which means *being persuasive is a product-design skill at Netflix, not a soft skill.*
2. **Hawkins admits its own past mistakes.** Specifically: shipping components broadly before stress-testing them in real product context. Worth knowing if you're about to consume something new — ask how long it's been validated.
3. **"Don't blindly mimic Google's Material or Apple's HIG."** This is the Hawkins team's own warning, even though Hawkins is built on MUI. The distinction is *platform vs. product* — Netflix is a product, not a platform.

---

## How to actually use this

I've been mining the corpus for **prototype prompts** — small designable mechanics that capture something about Netflix's culture, not just its visual language. Started a working list here:

📋 [`notes/projects-and-prompts.md`](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins/notes/projects-and-prompts.md)

The first entry is the "convince another team" mechanic as a UI primitive. Open to feedback on whether any of the others are worth turning into Issues or prototypes.

---

## Open questions (please reply)

I would love to hear from anyone closer to Hawkins, or anyone with a clearer read on:

1. **Validation status as a first-class component state** — does Hawkins (or any system you've worked with) actually track "shipped but not yet validated in product context" visibly? Or is it implicit?
2. **The two-flavor split** — Consumer vs. Professional sharing tokens but diverging on components: where's the seam in practice? Do designers carry mental models across both, or do they specialize?
3. **The "convince another team" loop** — is there a designed artifact for it (template, RFC, channel) or is it conversational?
4. **What's missing from the public record?** What's commonly assumed about Hawkins externally that you'd push back on?

---

## How this knowledge base is organized

```
context/hawkins/
├── README.md          ← timeline + index
├── sources/           ← one file per primary/secondary/context source
│                        with attribution frontmatter and verbatim quotes
└── notes/
    └── projects-and-prompts.md  ← problems-to-tackle, prompts to pick up
```

Plus a higher-level synthesis at [`context/hawkins-research.md`](https://github.com/mattdonovan/netflix-ideas/blob/main/context/hawkins-research.md) that the rest of this prototype repo builds against.

The rule: every Hawkins claim in this repo should trace back to a source file. If you find an unsourced claim, please call it out.

---

*This is a working primer. It will get more wrong before it gets more right.*
