# Hawkins research

Compiled from public sources May 2026. Hawkins is sparsely documented externally — most of this is reconstructed from talks, blog posts, and third-party writeups. Treat each claim with the caveat that we're inferring.

> 📚 **Raw sources now live under [`context/hawkins/`](./hawkins/)** with strict attribution frontmatter and verbatim quotes where possible. Every claim in this synthesis should be checkable against a file in [`context/hawkins/sources/`](./hawkins/sources/). Topic-level cross-source synthesis lives in [`context/hawkins/notes/`](./hawkins/notes/). See the [knowledge base README](./hawkins/README.md) for the index and timeline.

## What it is

Netflix's design system, named after Hawkins, Indiana (Stranger Things). Two variants share one foundation:

- **Hawkins Consumer** — member-facing experiences: streaming app on Android, iOS, TV, and Web.
- **Hawkins Professional** — internal/enterprise tools used by Content Operations, Marketing, Engineering, Netflix Studio.

Both pull from a shared token layer (color, spacing, typography, motion, icons) and share React component primitives.

## The Material UI relationship

> "On the engineering side, Netflix decided to build on top of Material-UI, leveraging it to get a ton of components out of the box that they could configure and style to meet the needs of Hawkins."

Key nuance:

- Netflix **obfuscates** Material-UI usage at the component boundary so that consumers of Hawkins components never see a MUI prop signature. This lets the Hawkins team upgrade, swap, or replace MUI later without breaking every downstream surface.
- The Hawkins team has explicitly warned against "blindly mimicking Google's Material or Apple's HIG." Use Material's component anatomy as scaffolding, then override aggressively at the token layer so the result reads as Netflix.

**Implication for this project:** We do the same thing. We import MUI components but wrap them in a thin Hawkins-flavored layer (`<HxButton>`, `<HxCard>`, etc.) so the rest of our app code never imports `@mui/material` directly. The theme does the heavy lifting on visuals; the wrappers do the heavy lifting on API.

## Typography

- **Netflix Sans** — proprietary, developed in-house (~2018) to reduce licensing costs and reinforce brand consistency. It is not publicly available. We will use **Inter** as a stand-in (similar humanist sans, open license) with letter-spacing tuned tight to match Netflix Sans's compressed feel.
- Type scale prioritizes legibility at distance over information density.
- Tight letter-spacing on headlines, loose tracking on small UI labels.

## Tokens (inferred, not authoritative)

Hawkins doesn't publish its token values. We extract the spirit from screenshots and the public Netflix UI:

- **Color** — dark-first; the primary palette is dominated by deep blacks (~#0B0B0B background, near-black surfaces), Netflix red `#E50914` as the single brand pop, large amount of midtone gray. White is **never pure** — Netflix's UI uses warm off-whites (#F5F5F5 region) to avoid the flicker/halo issue on consumer TVs.
- **Spacing** — likely an 8px base scale (`8, 16, 24, 32, 40, 48, 64, 96`). TV layouts use larger steps (`32, 64, 96, 128`) for safe-zone-respecting gutters.
- **Radius** — modest. Cards and posters are essentially square (2–6px) on TV; chips and pills use larger radii.
- **Motion** — generous timing curves on focus (200–250ms), faster on press (~120ms), slow for entrance (~400ms). Easing is custom, not Material's standard.

## Design philosophy: "Guidance over governance"

The Hawkins team's stated stance:

> "Start with Hawkins components. If that doesn't work, use Hawkins tokens to at least match the feel. If you're doing something truly custom, talk to the team."

This is a layered fallback model. Three tiers:

1. Component → use the system as designed.
2. Tokens → if the component can't bend, at least the visual language matches.
3. Conversation → if even tokens aren't enough, the system is incomplete and that's a team problem, not a contributor problem.

**Implication for review lenses:** Components in this prototype that work in isolation but break under TV focus, or look right in the hero but break in dense layouts, fail the tokens-tier promise.

## Infrastructure

- **Figma** is the design library home base.
- **Storybook** for component visualization.
- Custom **Hawkins API** + Figma plugins for code-to-design and design-to-code sync.
- Weekly stand-ups, design huddles, office hours, Slack channels — the system is treated as a team product, not a static deliverable.

## Known gaps (Hawkins team's own admissions)

- Validation with feature teams was historically late — components were broadly deployed before being stress-tested against real product needs, leading to post-launch performance issues.
- Adoption metrics are mature; engagement, contribution, and satisfaction metrics are still developing.

## What we steal vs. what we leave

**Steal:**
- The Material-on-the-inside-Hawkins-on-the-outside architecture.
- The token-first override approach (instead of forking components).
- The dark-first, single-pop-color palette discipline.
- The fallback ladder mental model (component → token → conversation) for our experiments sandbox.

**Leave:**
- Netflix Sans (license).
- Netflix red as the brand color (we are not Netflix; we are a prototype *about* Netflix — using their exact mark would be sloppy and also legally murky). Use a deliberately adjacent red that signals "Netflix-flavored" without being Netflix.
- Their content imagery (license, copyright). Use a clearly fake content set so demos don't read as misappropriation.

## Cross-source triangulation (added 2026-05-24)

Three observations strengthened by reading additional sources tonight (Schema 2021 talk in full, Wiki Chaves case study, Joshua Godi Tech Blog in full, three context sources):

- **Bottom-up adoption is a durable cultural trait, not a system choice.** Same value visible in 2018, 2023, and 2025 from three different speakers. "Guidance over governance" is downstream of this — try to copy it without the cultural substrate and it collapses into a polite system nobody adopts.
- **Outliers (parallel library) is the explicit third state.** Components don't have to be either "in the system" or "rogue" — Hawkins names a legitimate third destination for in-flight, product-validation-pending components. Our `src/experiments/` registry is shaped like this; worth naming as Outliers-inspired.
- **The Hawkins team's most-stated regret is shipping components broadly before stress-testing them in product.** Two separate sources (Godi 2021, Pal 2025) flag this. Argues for treating "validation status" as a first-class component state.

See [`hawkins/notes/operations-and-contribution-model.md`](./hawkins/notes/operations-and-contribution-model.md) and [`hawkins/notes/projects-and-prompts.md`](./hawkins/notes/projects-and-prompts.md) for the longer reads.

## Sources

Primary, secondary, and Netflix-culture context sources are captured one-per-file at [`context/hawkins/sources/`](./hawkins/sources/). High-level pointers:

- **Hawkins primary:** [Schema 2021 talk (Orio + Yee)](./hawkins/sources/video-schema-2021-guidance-over-governance.md), [Joshua Godi — Netflix Tech Blog 2021-02-10](./hawkins/sources/blog-netflix-techblog-godi-2021.md), [Wiki Chaves — case study](./hawkins/sources/blog-wikichaves-netflix-design-system.md)
- **Secondary:** [Prince Pal — 2025-08-05](./hawkins/sources/blog-princepal-2025.md)
- **Netflix-culture context (not Hawkins-specific):** [Design careers reel ~2018](./hawkins/sources/video-netflix-design-careers-2018.md), [Ex-Netflix engineer ~2023](./hawkins/sources/video-ex-netflix-engineer-2023.md), [Elizabeth Stone CTO interview ~2025](./hawkins/sources/video-pragmatic-engineer-elizabeth-stone-2025.md)
- **Outstanding pending capture:** [How we built Hawkins (engineering companion talk)](https://www.youtube.com/watch?v=LtrXwX81CPE)
- **Lower-confidence external commentary, not yet captured:** [Walking the Netflix Paved Road — Misha Kazakov, GitNation](https://gitnation.com/contents/walking-the-netflix-paved-road-bumps-included-web-framework-hawkins-design-system-and-genai), [What design system does Netflix use? — designgurus.io](https://www.designgurus.io/answers/detail/what-design-system-does-netflix-use)
