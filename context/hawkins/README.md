---
name: Hawkins knowledge base index
description: Raw sources + synthesis pointers for Netflix's Hawkins design system
---

# Hawkins knowledge base

Raw-source layer for everything we collect about Netflix's Hawkins design system. The goal is **citable, verifiable, re-derivable** — every claim we make about Hawkins should trace back to a source file here.

## Layers

```
context/
├── hawkins-research.md      ← top-level synthesis (existing, cross-source)
└── hawkins/
    ├── README.md            ← this file (the index)
    ├── sources/             ← one file per source, raw + frontmatter
    └── notes/               ← per-topic synthesis, cites multiple sources
```

- **Synthesis** lives at `context/hawkins-research.md` — already established, edit there when adding cross-source claims.
- **Sources** live one-per-file in `sources/` with strict attribution frontmatter and verbatim body text where possible.
- **Notes** in `notes/` are per-topic distillations (tokens, motion, operations, etc.) that link to multiple sources.

## Storage rule

- ✅ Save: transcripts, blog post bodies, our own notes (text, fair-use-with-attribution, small)
- ❌ Don't save: video files, downloaded YouTube assets — link to source URL and embed in Discussions instead
- `.gitignore` blocks `*.mp4`, `*.webm`, `*.mkv`, `*.mov`, `*.m4v` proactively

## Sources captured

_Updated as the knowledge base grows. Last updated: 2026-05-24._

### Videos (Hawkins-primary)

| File | Title | Author(s) | Year |
|---|---|---|---|
| [`video-schema-2021-guidance-over-governance.md`](./sources/video-schema-2021-guidance-over-governance.md) | Guidance over governance | Luca Orio, Jen Yee | 2021 |

### Blog posts (primary — Netflix team / former Netflix)

| File | Title | Author | Published |
|---|---|---|---|
| [`blog-netflix-techblog-godi-2021.md`](./sources/blog-netflix-techblog-godi-2021.md) | Hawkins: Diving into the Reasoning Behind our Design System | Joshua Godi (Hawkins team) | 2021-02-10 |
| [`blog-wikichaves-netflix-design-system.md`](./sources/blog-wikichaves-netflix-design-system.md) | Netflix Design System | Wiki Chaves (Netflix 2020–2022) | undated |

### Blog posts (secondary — external commentary)

| File | Title | Author | Published |
|---|---|---|---|
| [`blog-princepal-2025.md`](./sources/blog-princepal-2025.md) | Hawkins at Netflix: A Design System That Grows With the Product | Prince Pal (independent) | 2025-08-05 |

### Netflix engineering/design context (not Hawkins-specific)

These are not about Hawkins, but they triangulate the **culture** Hawkins was built into. Useful for understanding the "why" behind decisions like bottom-up adoption and guidance-over-governance.

| File | Title | Author(s) | Year |
|---|---|---|---|
| [`video-netflix-design-careers-2018.md`](./sources/video-netflix-design-careers-2018.md) | Netflix design careers — interview reel | Multiple unnamed Netflix XD | ~2018 |
| [`video-ex-netflix-engineer-2023.md`](./sources/video-ex-netflix-engineer-2023.md) | What made Netflix different from other big tech | Unnamed ex-Netflix engineer | ~2023 |
| [`video-pragmatic-engineer-elizabeth-stone-2025.md`](./sources/video-pragmatic-engineer-elizabeth-stone-2025.md) | Inside Netflix engineering culture | Elizabeth Stone (CTO) w/ Gergely Orosz | ~2025 |

### Pending — flagged for capture

- **"How we built Hawkins"** (https://www.youtube.com/watch?v=LtrXwX81CPE) — linked from Joshua Godi's Tech Blog post. Engineering-side companion talk. **Transcript needed.**

## Timeline (lightweight)

Quick chronological view of every source captured so far. Use this to see how the same themes (bottom-up culture, designer-as-strategist, guidance over governance) recur across 7+ years from different vantage points.

```
~2018  ──  Netflix design careers reel                       [context]
              ↳ "designer-as-strategic-partner" framing already in place
2021-02  ──  Joshua Godi — Tech Blog                          [Hawkins primary]
              ↳ build-vs-buy rationale, MUI, Storybook, adoption playbook
2021     ──  Orio + Yee — Schema talk "Guidance over governance" [Hawkins primary]
              ↳ Consumer vs. Professional flavors, Moria, Figmagic, polls
2020–22  ──  Wiki Chaves — case study (undated, role-bounded) [Hawkins primary]
              ↳ 7-step ops workflow (Backlog → Voting → ... → Support)
~2023    ──  Ex-Netflix engineer — opinion clip               [context]
              ↳ top-of-personal-market comp + "convince another team" mechanic
2025-08  ──  Prince Pal — synthesis blog                      [Hawkins secondary]
              ↳ retells primaries, adds "components vs. connections" opinion
~2025    ──  Elizabeth Stone (CTO) — Pragmatic Engineer       [context]
              ↳ scale, Open Connect, live, Keeper Test, "innovation from within"
```

**Triangulation hits worth noting:**
- *Bottom-up / self-directed contribution*: 2018 reel + 2023 ex-engineer + 2025 Stone (3 vantage points, 7 years apart)
- *Designer/engineer as strategic partner*: 2018 reel + 2021 Schema talk + Stone 2025
- *Guidance over governance (or its precursors)*: 2018 reel framing → 2021 Schema talk vocab → Pal 2025 retelling

See [`notes/projects-and-prompts.md`](./notes/projects-and-prompts.md) for problems-to-tackle / prompts surfaced from these sources.

## Attribution model

Every source file's frontmatter:

```yaml
---
title: ""
author: ""
author_role: ""
url: ""
source_type: "video" | "blog" | "podcast" | "article" | "talk"
accessed: "YYYY-MM-DD"
publication_date: "YYYY-MM-DD" | null
license: "Description of reuse terms"
covers: ["topic-slug-1", "topic-slug-2"]
quoted_in: []  # filled as we cite this in notes/, discussions, blog
---
```

When we cite in `notes/` or in Discussions or in the blog draft, the in-text reference uses `[Author, YYYY-MM-DD]` or `[AuthorLast]` and links back to the source file.

## How to use this

- **Reading?** Start with `context/hawkins-research.md` for the synthesis, then dive into source files for primary material.
- **New product designer at Netflix using this as a primer?** Go to the [Hawkins Discussions category](https://github.com/mattdonovan/netflix-ideas/discussions) (TODO: link once seeded).
- **Adding a source?** Copy an existing file in `sources/`, fill in the frontmatter, paste the content verbatim where possible, then update the table above and consider whether the synthesis layer needs an edit.
