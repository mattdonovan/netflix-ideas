# Figma integration plan

**Source:** Netflix Design System Figma (file `2Sd5rNCmrEYarVt2yqNcFc`), 17 frames covering type, color, controls, hero, movie preview, content blocks, plus app templates.

**Rule of engagement.** Figma layers *on top of* MDS pass-1 findings. It does not overwrite them. Pass-1 decisions stay:

- Off-white text (#F5F5F5), never pure white — TV halo
- 24pt body floor — couch test
- Restored cursor, no key-cap RemoteCue, scaled TvFrame, column-with-cue-below Channels layout
- Tile content treatment (title baked into art) is still a sweep-2 target — the Figma `Movie Preview` frames *confirm* this direction, they don't introduce it
- Brand restraint — no NETFLIX wordmark in our header

Anything in this plan that conflicts with the above defers to the above.

---

## 1. What we take from Figma

### 1a. Tokens — `src/theme/tokens.ts` additions

**Color.** The Figma file ships a full neutral ramp (#000 → #FFFFFF in 10–15 stops) plus brand red `#E50914`. Our `tokens.color` already covers the ramp semantically — *don't* mass-rename to match Figma slot names. Two specific changes:

- Add `tokens.color.brand = "#E50914"` as a *named* slot so we can reach for real Netflix red when a screen wants it (e.g., the upcoming Invite prototype, or a billboard accent). Keep `accent = "#E4404C"` as the system accent. The two are deliberately distinct — `brand` is a quotation, `accent` is the voice.
- Add `tokens.color.errorRed = "#E50914"` mapping for inputs/danger states. Today `danger = #E4404C`; Figma's input error stroke is the brand red. Aliasing is fine.

No other color additions — Figma's grey ramp granularity (10+ stops) is overkill for a 3-route prototype.

**Typography.** Figma uses Netflix Sans 11–55 px on a web scale. Our scale is TV-tuned (24 px floor, 96 px display). **Do not adopt Figma sizes.** What we *do* take is the *ratio* and *naming convention* — Figma's "T1 / T2 / Headline / Subheadline / Caption / Caption Small" hierarchy validates our `display / h1–h4 / body / bodySmall / label / micro` shape. No change needed.

One addition: Figma type frame shows weight pairs (Light 300, Regular 400, Medium 500, Bold 700). We're missing `light: 300` — add it to `tokens.type.weight` for the hero billboard treatment.

**Radius / spacing.** Nothing in Figma changes our 4-px base spacing or radius scale. Skip.

### 1b. Components — what to adopt via MUI theme overrides

Build out `src/theme/hawkins.ts` `components` overrides for these three, in this order:

1. **`MuiButton`** — Figma `Buttons` frame defines:
   - Primary: brand red fill, white text, 4–8 px radius, semibold
   - Secondary: outlined, 1.5 px border, transparent fill
   - Tertiary/ghost: text-only
   - Circle (movie-preview overlay): 44 px circular, semitransparent fill, icon-only
   
   Map these to MUI variants `contained` (primary brand red), `outlined` (secondary), `text` (tertiary), and a custom variant `circle` (via `variants:` slot in MUI 6). We need this for the upcoming acceptance-moment choreography in PromptPanel.

2. **`MuiTextField` / `MuiInput`** — Figma `Input Fields` frame:
   - Idle: thin grey border on dark fill
   - Focus: white inner stroke (this is the move — not a glow, a *stroke*)
   - Error: red stroke + helper text below
   - Disabled: reduced opacity
   
   PromptPanel currently uses a custom textarea. Refactor it to MUI `TextField multiline` with our theme overrides, so the focus state is consistent with the rest of the system.

3. **`MuiChip`** — Figma `Icons and Labels` frame has pill-shaped tag labels. Channels currently renders category tags as ad-hoc Boxes. Move to `Chip` with theme overrides matching Figma's pill: 4 px radius (not full pill), semibold micro text, surface-low background.

**Skip these components.** Figma `Hero Banners`, `Video Player`, `Active Player`, `Movie Details`, `Account Home`, `Landing Page`, `Authentication`, `Who's Watching` — none are in scope for the two prototypes. We're not building Netflix; we're building two ideas inside Netflix.

**Movie Preview overlay buttons** (the circular play/info/+ buttons over poster art) — adopt the *visual* but not the component. They become tile overlays in sweep-2's tile-rework, rendered inline rather than as a reusable component.

---

## 2. Content strategy

**Recommendation: curated JSON catalog + TMDB API for poster artwork. No database.**

Rationale:

- **Real artwork is the single highest-leverage MDS fix.** Pass-1 flagged color-block tiles as the "iTunes 2008" problem. Real poster art solves it in one move. Color blocks become unused.
- **A database is overkill for a prototype.** We have ~3 routes and one prompt → category → 6 exemplars loop. Even at 50 channels × 6 exemplars = 300 titles, JSON loads in <50 ms.
- **TMDB has what we need.** Free API, no auth required for read-only poster CDN URLs once you have a TMDB ID. Hotlink the CDN URL into the tile background — zero infra.
- **Claude already returns titles.** The Ranker emits `{title, year, oneLine}`. We add a sidecar lookup: title + year → TMDB ID → poster URL. Cache the lookup in localStorage so repeated prompts are instant.
- **Failure mode is graceful.** If TMDB lookup fails (rare title, typo, network), fall back to the existing color block. No empty states.

**What we build:**

1. `src/lib/tmdb.ts` — single function `getPosterUrl(title, year): Promise<string | null>`. Uses TMDB `/search/movie` + `/search/tv`, picks best match, returns `https://image.tmdb.org/t/p/w500/<path>`. Caches in localStorage by `title|year`.
2. `src/lib/catalog.ts` — curated seed of ~80–120 titles already enriched with TMDB ID + poster URL, so the first paint of `seedChannels` is instant. Generated once via a Node script (`scripts/enrich-catalog.mjs`), committed to git as data.
3. `Tile` accepts an `artworkUrl` prop. When present, renders a `background-image` cover. When absent, falls back to color block.

**What we don't build:** No SQLite, no Postgres, no Prisma, no API routes. If content needs scale up to 1000+ titles later, revisit.

**One caveat to flag:** TMDB requires a free API key for search calls (not for CDN delivery). Add `VITE_TMDB_API_KEY` to `.env`. CI/Railway gets the key as an env var. The pre-enriched `catalog.ts` means the app works without the key at runtime — the key is only needed when *new* titles arrive from Claude.

---

## 3. Execution order

The order matters — each step unblocks the next.

1. **Tokens.** Add `color.brand`, `color.errorRed`, `type.weight.light`. Trivial, no breakage. ✅
2. **`scripts/enrich-catalog.mjs` + `lib/catalog.ts`.** Pull TMDB IDs, poster URLs, *and backdrop URLs* for the existing `seedData.ts` titles + ~80 expansion titles. Commit the result.
3. **`lib/tmdb.ts`.** Runtime lookup with localStorage cache. Hook into the Ranker so new Claude-emitted titles get artwork on demand.
4. **`Tile` artwork.** Accept `artworkUrl`, render cover image, keep color-block fallback. **This is the biggest visual win in the whole sweep** — it transforms the channels view in one commit. ✅ (prop wired, awaiting data)
5. **Home hero.** Billboard-scale backdrop image + title + tagline + CTA pair on `/`. Picks a rotating feature from the enriched catalog. Replaces the current text-only intro as the page's first impression. This is the strong visual signal for the landing page.
6. **MUI theme overrides — `MuiButton`.** Primary/secondary/circle variants. Used by PromptPanel actions *and* the new Home hero CTA pair (Play / More Info).
7. **MUI theme overrides — `MuiTextField`.** Refactor PromptPanel to use MUI input.
8. **MUI theme overrides — `MuiChip`.** Refactor category tags.
9. **Sweep-2 MDS findings layer on top:** tile content treatment (title-baked-into-art now works because we have art), acceptance moment choreography, caption typography, FocusRing → box-shadow, header restraint, RemoteCue idle-fade, MicState single-effect-per-state.

Steps 1–4 are the unlock. 5–7 are quality-of-life. 8 is where pass-2 finishes the job.

---

## 4. Open questions

- **Brand red vs accent red.** Right now `accent = #E4404C`, deliberately adjacent to Netflix red. With `color.brand = #E50914` added as a named slot, the question is: does anything in the current screens want the real brand red? My read: no — leave accent as-is, hold brand red in reserve for the Invite prototype's "share" CTA and the upcoming sweep-2 acceptance moment (a brief red flash on category-accepted), where the quotation is intentional.
- **TMDB rate limits.** 40 req / 10 s. Pre-enriching the seed catalog means we never hit this in normal use. Flag if it ever bites.
- **Catalog hand-curation.** ~80 expansion titles need to be picked. I'll pull them from the seed channels' adjacency space (warm cinematography, new nostalgia, monster movies with soul) plus 3–4 new prototypical channel categories so demos feel populated.
