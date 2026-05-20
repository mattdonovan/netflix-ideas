# netflix-ideas

A sandbox for two Netflix feature concepts — built primarily as a way to
practice reviewing prototypes against a panel of named design lenses, not
as a polished pitch.

**Live deploy:** [netflix-ideas-production.up.railway.app](https://netflix-ideas-production.up.railway.app/)

The prototypes:

- **Channels** — Replace predefined recommendation rows with user-defined
  channels. The user types (or speaks) what they want, Claude assigns a
  category, and content fills in from a small enriched catalog. The
  interesting surface is the *iteration loop* — the third tweak, the fifth,
  the user who said "more soul" and got the same thing.
- **Invite** — Share a show or movie via QR → the recipient opens a mobile
  companion page → watches a free sample → joins the inviter's
  recommendation graph. The interesting surface is the *recipient* side, not
  the inviter.

Surfaces are **web-first** right now (built and reviewed against a 1920px
desktop canvas), even though the design language borrows from Netflix's
10-foot TV idiom. The TV-specific concerns (D-pad nav, 5% safe zone,
focus-as-cursor) live in the code as latent constraints; the active review
surface is what shows up in a browser.

## Why this exists — the review lenses

This repo is built around a deliberate review practice. Every visual or
behavioral pass is reviewed through `context/review-lenses.md` — a roster of
named designers (Frank Chimero, Josh Mateo, Niyati Gupta, Diana Lu, MDS) and
stakeholder personas, each with a specific failure mode they look for. The
goal is never seven full reviews per pass; it's 1–2 high-signal opportunities
per active lens, with a default posture of **critical, not affirming**.

The framing borrows directly from
[Niyati Gupta's talk on AI and design](https://www.youtube.com/watch?v=fYUDYas0qzc):

[![Niyati Gupta — Designing in the AI era](https://img.youtube.com/vi/fYUDYas0qzc/0.jpg)](https://www.youtube.com/watch?v=fYUDYas0qzc)

Her core point: **design teams don't ship the wrong design — they ship the
wrong *decisions*.** A design that looks polished can still encode a wrong
decision about what the surface is for, who it serves, what state of the user
it assumes. The lenses in this repo exist to surface those decisions early,
while there's still time to reverse them, instead of letting the surface
freeze and the decision freeze with it.

Each lens carries one such decision-shaped question. Frank Chimero asks
whether the design has decided to honor the screen's capacity for change, or
to treat it as paper that lights up. Niyati asks whether the AI loop is a
demo or a graduating system — whether the third iteration has been designed,
or only the first. Josh Mateo asks whether the surface could only exist at
Netflix, or whether it's a generic streaming UI with red applied. The whole
roster is in `context/review-lenses.md`.

## Stack

Vite · React · TypeScript · Material UI · Anthropic SDK · Railway

API keys live in Railway service variables in production and in a local
`.env` in development.

## Develop

```bash
cp .env.example .env  # then paste your Anthropic API key
npm install
npm run dev
```

## Repo layout

```
context/      Research and review lenses (the reason this repo exists)
reviews/      Generated review passes against the prototypes
src/          App code
  theme/      Hawkins-flavored MUI tokens
  primitives/ Row, TopTenRow, Tile, focus engine, brand glyphs
  prototypes/ Channels, Invite
  lib/        Catalog, Claude client, focus engine
scripts/      Playwright snap scripts used during review passes
```

See `context/review-lenses.md` for the review process and
`reviews/` for the artifacts each pass produces.
