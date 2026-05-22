# netflix-ideas

A sandbox, not a pitch.

**Live:** [netflix-ideas-production.up.railway.app](https://netflix-ideas-production.up.railway.app/)

I built this in a few evenings to practice two things. One was a review habit. A roster of named designers and stakeholders, each looking for a specific failure mode, run against every visual pass. The other was just wanting to draw on a familiar surface and see what fell out.

## What's in here

**Channels** is the part I actually built. The idea is that you write your own rows. You type "shows my dad would secretly love" and the row reshapes itself. The interesting part isn't the first iteration. It's the third. It's the user who said "more soul" and got the same thing back. That loop is where the actual design problem lives.

**Idea Hopper** is the parking lot for everything else. Invite, AI recommendations done properly, a tools suite for independent productions. Those didn't get built this round. They're listed so they don't get lost.

The surface is a desktop browser pretending to be a TV. The catalog is a small enriched set of real titles. The Claude calls are real but scoped. I don't work at Netflix.

## Why review lenses

Every visual pass gets run through `context/review-lenses.md`, a roster of named designers and stakeholder personas. Each one has a specific failure mode they look for. The default posture is critical, not affirming. A few high-signal hits per pass beats a tidy seven-section writeup that nobody acts on.

The framing borrows from [Niyati Gupta's talk on AI and design](https://www.youtube.com/watch?v=fYUDYas0qzc).

[![Niyati Gupta — Designing in the AI era](https://img.youtube.com/vi/fYUDYas0qzc/0.jpg)](https://www.youtube.com/watch?v=fYUDYas0qzc)

Her core point: design teams don't ship the wrong design, they ship the wrong decisions. A polished surface can still encode a wrong call about who it's for, what state of the user it assumes, what the third tap should do. Lenses exist to surface those decisions while they're still cheap to reverse.

## A big thanks to Ivanna Jeraskina

This whole thing got off the ground because of [Ivanna Jeraskina's Netflix Design System (2024 — Website ver.)](https://www.figma.com/community/file/1345502663442900887/netflix-design-system-2024-website-ver) on the Figma community. I pulled it in through Figma's MCP server and was moving in hours instead of days. Components, tokens, type scale, hero patterns, everything. If you're poking at Netflix-shaped surfaces in Figma, start there.

## Try your own idea

This thing is a sandbox. Clone it. Rip out Channels. Drop in your own row, your own loop, your own provocation. The primitives (Row, TopTenRow, Tile, the focus engine) are reusable. The Hawkins-flavored tokens give you a credible-looking starting surface in about ten minutes. If you build something fun on top of it, I'd love to see it.

```bash
git clone https://github.com/mattdonovan/netflix-ideas
cd netflix-ideas
cp .env.example .env  # paste your Anthropic API key
npm install
npm run dev
```

## Stack

Vite · React · TypeScript · Material UI · Anthropic SDK · Railway

API keys live in Railway service variables in production and in a local `.env` in development.

## Repo layout

```
context/      Research and review lenses (the reason this repo exists)
reviews/      Generated review passes against the prototypes
src/
  theme/      Hawkins-flavored MUI tokens
  primitives/ Row, TopTenRow, Tile, focus engine, brand glyphs
  prototypes/ Channels, Idea Hopper
  lib/        Catalog, Claude client, focus engine
scripts/      Playwright snap scripts used during review passes
```

See `context/review-lenses.md` for the review process and `reviews/` for the artifacts each pass produces.
