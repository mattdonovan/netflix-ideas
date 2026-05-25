---
title: "Reading Hawkins from the outside"
status: draft
target: TBD — likely GitHub Discussion + external repost
started: 2026-05-24
updated: 2026-05-24
author: "Drafted by Claude (Anthropic), in collaboration with Matt Donovan"
---

# Reading Hawkins from the outside

> 🤖 **Drafted by Claude (Anthropic) in collaboration with [@mattdonovan](https://github.com/mattdonovan).** Draft. Updated live from the working session. Final pass: TBD. Reviewed and edited by Matt before publication.

## What this is

An evening of desk research about Netflix's Hawkins design system, written up from the perspective of someone who is *not* on the Hawkins team and has no access to internal materials. Everything here is built from public sources — blog posts, conference talks, and recruitment videos — captured in a knowledge base at [`context/hawkins/`](../../context/hawkins/) so every claim is traceable.

This is the version of the story that you'd want as a new product designer joining Netflix and trying to skip the part where you spend two weeks asking the wrong questions.

## The setup

The project this draft sits inside ([netflix-ideas](https://github.com/mattdonovan/netflix-ideas)) is a prototyping sandbox: two small feature prototypes (Channels and Invite) built with MUI dressed up to feel Netflix-y, an experiments sandbox, and a deliberately fake content catalog. It's not affiliated with Netflix. It exists to practice a particular kind of work — designing inside someone else's design language, well enough that the seam doesn't show.

To do that work credibly, you need a real read on the design system you're channeling. Hence the research.

## The corpus

Seven public sources, captured tonight, spanning ~2018 to ~2025. Three primary Hawkins sources (Joshua Godi's Netflix Tech Blog post, the Schema 2021 talk by Luca Orio and Jen Yee, Wiki Chaves's portfolio case study), one secondary synthesis (Prince Pal's 2025 blog), and three Netflix-culture context sources (a 2018 design careers reel, a 2023 ex-engineer opinion piece, and Elizabeth Stone's ~2025 Pragmatic Engineer interview).

The three context sources aren't about Hawkins. They're about *the culture Hawkins was built into.* That distinction turned out to matter more than I expected.

## What the corpus actually says

A few patterns held across multiple sources:

**1. Hawkins is two systems sharing one spine.** Consumer (member-facing) and Professional (Studio + ops tools) share tokens, icons, and a design DNA, but diverge on components. Both Joshua Godi's article and the Schema talk confirm this; Prince Pal's piece restates it well as "two paths, one spine."

**2. It's built on Material-UI underneath, but you'd never know.** Hawkins wraps MUI so consumers of Hawkins components never see a MUI prop signature. The point is reversibility — they can swap MUI later without breaking every product team. Godi's article is explicit about this. The piece of this that I underestimated before tonight: it's an *engineering* decision in service of a *governance* decision. The wrapper is the moat.

**3. The team's stated philosophy is "guidance over governance."** The Schema talk's title says it. The fallback model is a three-tier ladder: use a component, fall back to tokens, fall back to a conversation with the team. The third tier is the system admitting it's incomplete — not the user breaking rules.

**4. The team operates Hawkins like a product, not a deliverable.** Quarterly satisfaction polls, office hours, Slack on-call rotations, weekly design huddles, Storybook visualization, two custom Figma plugins (Moria for catalog data, Figmagic for onboarding). Wiki Chaves's case study even names a seven-step operating workflow: Backlog → Voting → Roadmap → Design → Eng → Release → Support.

**5. They've named their own mistakes.** The most consistent one: shipping components broadly before stress-testing them in real product context. Both Godi's article and Pal's synthesis flag this. It's a useful counter-example for anyone building a system from scratch.

## What the *context* sources add

Reading the three non-Hawkins sources back-to-back was the part of the evening that paid off in unexpected ways. The same values come up in 2018, in 2023, in 2025, from three different people in three different roles. That's not rhetoric — that's a durable cultural trait.

The clearest example: **bottom-up decision-making.** The 2018 design careers reel says it as "you have the ability to impact any part of the product that you feel passionate about." The 2023 ex-engineer says it as "engineers decide what projects to work on." Elizabeth Stone in 2025 says it as "innovation is really driven from within the teams rather than top down." Same value, three vantage points, seven years apart.

Why does that matter for *Hawkins?* Because "guidance over governance" doesn't make sense as a design-system philosophy if the surrounding culture is top-down. Hawkins isn't standing on a clever vocabulary choice. It's standing on a company that already operates that way. Try to copy "guidance over governance" without that substrate and you'll get a polite system that nobody adopts.

## The thing I want to build

The ex-Netflix engineer in the 2023 clip names something I hadn't seen articulated before: a mechanic he calls **convincing another team.** Because decision-making is bottom-up, every cross-team project requires the proposer to go and persuade the other teams individually that their work is worth spending time on. He credits the experience with making him a much stronger communicator.

That's not just a culture observation. It's a *designable mechanic.* Most prototypes hand-wave cross-team coordination ("…and then ops approves it"). A Netflix-y prototype that needs another team's buy-in could show the convincing happening — a lightweight RFC, an artifact, a shared doc. It would make the prototype feel structurally different from a generic SaaS workflow.

Captured this and a few other prompts at [`context/hawkins/notes/projects-and-prompts.md`](../../context/hawkins/notes/projects-and-prompts.md). The "convince another team" mechanic is the first one I want to actually build.

## What this changes about the project

Three concrete shifts after tonight:

1. **Citation discipline.** Every Hawkins claim in the project's research files now needs to trace back to a source file. The knowledge base structure (`context/hawkins/sources/` with strict frontmatter) makes this checkable.
2. **Context vs. primary distinction.** Not everything we know about Netflix is about Hawkins. The corpus separates them. This will keep us from accidentally claiming "Hawkins says X" when actually some unrelated ex-employee said X.
3. **Prototype prompts as a first-class artifact.** The `notes/projects-and-prompts.md` file is the first artifact whose explicit job is "turn reading into doing." This is where the next prototype loop starts.

## What didn't work

A few honest notes for anyone reading along:

- The Netflix Tech Blog has an SSL chain issue at fetch time. WebFetch fails; `curl` from the shell works. I lost about twenty minutes on this.
- YouTube Premium downloads don't materialize as files on disk; they live inside the web app and are DRM-protected. The practical workflow was pasting transcripts into the session by hand.
- I drafted a Discussion to seed the knowledge base as a public primer; it's saved at `context/hawkins/notes/discussion-draft-primer.md` awaiting review before going live. Auto-posting public discussions without the second pair of eyes is the wrong default.

## What's next

In rough order:

1. Ship the one meaningful Hawkins-informed update to the prototype tonight. Most likely candidate: a small "convince another team" surface inside the Channels prototype, demonstrating the mechanic in a real user flow.
2. Publish the primer Discussion after a review pass.
3. Cross-source synthesis notes (token discipline, contribution model, operations cadence) under `context/hawkins/notes/`.

The whole repo is at [github.com/mattdonovan/netflix-ideas](https://github.com/mattdonovan/netflix-ideas). The knowledge base sits under [`context/hawkins/`](../../context/hawkins/). Corrections, pushback, and "you got this wrong" notes are very welcome — file a Discussion or an Issue.
