# netflix-ideas

A sandbox, not a pitch.

**Live:** [netflix-ideas-production.up.railway.app](https://netflix-ideas-production.up.railway.app/)

I built this in a few evenings to practice two things. One was a review habit. A roster of named designers and stakeholders, each looking for a specific failure mode, run against every visual pass. The other was just wanting to draw on a familiar surface and see what fell out.

## What's in here

**Channels** is the part I actually built. The idea is that you write your own rows. You type "shows my dad would secretly love" and the row reshapes itself. The interesting part isn't the first iteration. It's the third. It's the user who said "more soul" and got the same thing back. That loop is where the actual design problem lives.

**Idea Hopper** is the parking lot for everything else. Invite, AI recommendations done properly, a tools suite for independent productions. Those didn't get built this round. They're listed so they don't get lost.

The surface is a desktop browser pretending to be a TV. The catalog is a small enriched set of real titles. The Claude calls are real but scoped. I don't work at Netflix.

## Why review lenses

Every visual pass gets run through [`context/review-lenses.md`](context/review-lenses.md). It's grown into a real system over the iterations — three tiers now, not one roster.

- **Tier 1 — Anchor lenses, every pass.** Five designers (Frank Chimero, Josh Mateo, Niyati Gupta, Diana Lu, Matt D. Smith) and three stakeholder personas (Discovery PM, Growth PM, TV Engineering Lead). Each anchor must Carry, Sit out, or Graduate — no echoes.
- **Tier 2 — Guest lenses, on rotation.** Don Norman, Rauno Freiberg, Paco Coursey, Emil Kowalski, Tina Roth Eisenberg, Paul Rand. Each is here to find a specific failure mode; you pick the one whose failure mode is most likely present in the work that shipped.
- **Tier 3 — Methodology lenses, weekly or when relevant.** Decision Lab biases index, IDEO.org equity framing, Warm Design accessibility, Netflix Tech Blog evidence rigor.

The system enforces a few disciplines that the original framing didn't have:

- **The Couch Test** runs before any lens — six feet back, can you tell where focus is in under a second? Read the primary text without leaning? Nothing in the outer 5%? A "no" is a blocker.
- **Carryover and graduation.** A lens that re-flags the same critique two passes in a row graduates the rule into [`context/project-rules.md`](context/project-rules.md) and stops re-raising it. Convergence without movement is an echo, not signal.
- **Default posture: critical, not affirming.** "Tight," "ships," "polished" without an adjacent concrete reason gets cut. If a lens has nothing to say, the review wasn't done — go back and look harder.

The framing borrows from [Niyati Gupta's talk on AI and design](https://www.youtube.com/watch?v=fYUDYas0qzc).

[![Niyati Gupta — Designing in the AI era](https://img.youtube.com/vi/fYUDYas0qzc/0.jpg)](https://www.youtube.com/watch?v=fYUDYas0qzc)

Her core point: design teams don't ship the wrong design, they ship the wrong decisions. A polished surface can still encode a wrong call about who it's for, what state of the user it assumes, what the third tap should do. Lenses exist to surface those decisions while they're still cheap to reverse.

## Hawkins, as far as the public record goes

Netflix's design system is sparsely documented externally. There's enough public material — one Tech Blog post, one Schema talk, a few designer portfolios, a recruitment reel, an ex-engineer's opinion clip, a CTO interview — to triangulate a real picture if you do the reading.

[`context/hawkins/`](context/hawkins/) holds that reading: every source captured one-per-file with attribution frontmatter and verbatim quotes where licensing allows, plus a timeline and cross-source notes. The synthesis lives at [`context/hawkins-research.md`](context/hawkins-research.md). The primer write-up is [Discussion #45](https://github.com/mattdonovan/netflix-ideas/discussions/45) — start there if you'd rather skim than dig.

The rule is that any Hawkins claim in this repo should trace back to a source file. If you spot an unsourced one, please call it out.

## A big thanks to Ivanna Jeraskina

This whole thing got off the ground because of [Ivanna Jeraskina's Netflix Design System (2024 — Website ver.)](https://www.figma.com/community/file/1345502663442900887/netflix-design-system-2024-website-ver) on the Figma community. I pulled it in through Figma's MCP server and was moving in hours instead of days. Components, tokens, type scale, hero patterns, everything. If you're poking at Netflix-shaped surfaces in Figma, start there.

## Try your own idea

This thing is a sandbox. Clone it. Rip out Channels. Drop in your own row, your own loop, your own provocation. The primitives (Row, TopTenRow, Tile, the focus engine) are reusable. The Hawkins-flavored tokens give you a credible-looking starting surface in about ten minutes. If you build something fun on top of it, I'd love to see it.

```bash
git clone https://github.com/mattdonovan/netflix-ideas
cd netflix-ideas
cp .env.example .env  # paste your Anthropic API key (see "Where to get a key" below)
npm install
npm run dev
```

You'll need [Node 20+](https://nodejs.org/) and an [Anthropic API key](https://console.anthropic.com/) (free credits to start). That's it.

## Designing alongside an AI agent

This repo was mostly built with an AI agent in the loop. None of that is required to use the repo — but if you've been curious about how designers actually work with Claude day-to-day, here's the shortest path to trying it on a real codebase.

Three reasonable on-ramps, easiest first:

- **[Cursor](https://cursor.com/)** — a fork of VS Code with the AI built in. Open this repo, hit `Cmd+L`, paste a question. Best if you've used VS Code before. Most familiar surface.
- **[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)** — Claude in your terminal. `npm install -g @anthropic-ai/claude-code`, then `claude` inside the repo. It can read files, run commands, and edit code with your permission. This is what built most of the recent commits. Best if you're comfortable in a terminal — it stays out of the way and reads the codebase faster than an IDE chat.
- **[Claude.ai](https://claude.ai/)** — paste files or links into a chat. No setup. Best for one-off questions or research; weakest for changing the actual code, since it can't see the repo.

Two things worth knowing before you start:

- **Read the [`context/`](context/) directory before asking Claude to change anything.** It's where the design point of view lives — the lenses, the rules, the Hawkins research. Without that, the agent will produce generic SaaS UI on a Netflix-looking surface. With it, it tends to do the right thing.
- **The lens system is for you, not just for Claude.** You can ask the agent to "run a review pass" against your changes and it'll fire the lenses out of [`context/review-lenses.md`](context/review-lenses.md). Or you can just read the file and run them in your head.

## For developers

A few notes that aren't obvious from the source:

- **Stack:** Vite · React · TypeScript · Material UI · Anthropic SDK · Railway.
- **MUI is wrapped, not consumed directly.** The pattern is borrowed from Hawkins: import MUI inside a thin Hawkins-flavored layer (`src/primitives/`, `src/theme/`) so the rest of the app never imports `@mui/material`. Lets the visual layer move without breaking product code.
- **`npm run lint`** runs `tsc --noEmit`. There's no ESLint config — type-checking is the floor.
- **`npm run snap`** runs Playwright snap scripts under `scripts/` to capture the prototype state for review passes. Used during the lens process.
- **`npm run review:check`** scans `reviews/*.md` and reports per-lens signals — whether any lens is ready for promotion to a skill file. See the bottom of `context/review-lenses.md`.
- **`npm run build-idea -- --name=<slug> [--title=<string>] [--glyph=<char>] [--web-ui | --tv]`** scaffolds a new prototype into `src/prototypes/<slug>/`, registers it on the picker, and auto-routes `/`<slug>`. Two templates: `--web-ui` (plain MUI on Hawkins tokens — the default) and `--tv` (wrapped in TvFrame with safe-zone). Add more under `scripts/templates/`.
- **Experiments registry.** Variants of prototypes live in [`src/experiments/registry.tsx`](src/experiments/registry.tsx) and render at `/experiments`. Each carries a validation state (`draft` / `validated` / `deprecated`) — borrowed directly from a Hawkins post-mortem on shipping components broadly before product-context validation.
- **API keys:** Railway service variables in production, local `.env` in development. Never commit a key.
- **Routes:** `/` (picker), `/channels` (the built prototype), `/experiments`, `/experiments/:id`, `/experiments?compare=A,B`.

## Repo layout

```
context/
  hawkins/          Source-cited knowledge base on Netflix's design system
  hawkins-research.md   Top-level Hawkins synthesis
  review-lenses.md  The full lens system (anchor / guest / methodology)
  project-rules.md  Constraints that graduated out of the lens system
  designer-research.md, tv-design-primer.md, ...
docs/
  blog/             Working drafts of posts about this project
reviews/            Generated review-pass artifacts (one file per pass)
scripts/            Playwright snap + lens-promotion check scripts
src/
  theme/            Hawkins-flavored MUI tokens
  primitives/       Row, TopTenRow, Tile, focus engine, brand glyphs
  prototypes/       Channels, Idea Hopper
  experiments/      Side-by-side variants registry
  lib/              Catalog, Claude client, focus engine
```

See [`context/review-lenses.md`](context/review-lenses.md) for the review process, [`reviews/`](reviews/) for the artifacts each pass produces, and [`context/hawkins/`](context/hawkins/) for the source-cited research the prototype builds against.
