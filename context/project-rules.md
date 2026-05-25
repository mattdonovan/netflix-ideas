# Project rules

Constraints the prototypes must obey. Each rule was graduated out of `context/review-lenses.md` because a lens flagged it across 2+ review passes without resolution — meaning it's a standing constraint, not a fresh perception. The lenses no longer re-raise these. The work checks itself against them before each push.

## How to read this file

- Scan it before shipping a change. If your change violates a rule, either fix the change or — if you mean to retire the rule — delete it here and note the retirement in the next review.
- A rule that's been here for months and is never violated is a candidate for `eslint` / pre-commit enforcement instead of a doc.
- A rule that gets repeatedly violated is a candidate for being wrong. Reconsider it.

## Format

```markdown
### <Short rule title>
- **Rule:** <one sentence the work must obey>
- **Promoted from:** <lens name>, <review file or issue link>
- **Why it's a rule, not a lens finding:** <usually "flagged N passes with no movement; it's a constraint, not a fresh perception">
- **How to check:** <what compliance looks like at code-review time>
```

---

### Netflix voice for system copy
- **Rule:** System-generated and chrome copy is silent, one word, or one short evocative phrase ("Searching", "Reading the room"). No designer voice ("Mind-melding", "Reticulating splines", "Whispering to ranker"). Card descriptions are one to two sentences, written in a TV-Guide register — describe what to watch, not how clever the channel concept is.
- **Promoted from:** Josh Mateo. Flagged in `reviews/2026-05-19-channels-first-pass.md`, `reviews/2026-05-22-channels-prompt-flow.md` (Opportunity 2 — LOADING_MESSAGES bank), `reviews/2026-05-24-channels-modal.md` (POPULAR_CHANNELS card descriptions). See issue #33.
- **Why it's a rule, not a lens finding:** Three review passes have surfaced the same critique on different surfaces. The pattern keeps reappearing because there is no shared rule — each new copy string is written fresh. The lens stops re-raising it; the rule does the work going forward.
- **How to check:** When you add or edit a copy string, scan it for: invented verbs, sentences over two lines, copy that explains the feature instead of describing what to watch, three-clause sentences, asides in parentheses, exclamation marks. If any of those, rewrite to a TV-Guide register or cut entirely.

### AI features ship the loop, not the demo
- **Rule:** Any surface that implies AI capability must also design the loop to refine, undo, or correct. A prompt with no path to a second prompt is a demo. An implied input modality (mic icon, suggestion chips, "voice search" affordance) must function or be removed. AI-as-decoration is the anti-pattern.
- **Promoted from:** Niyati Gupta. Flagged in `reviews/2026-05-20-channels-iteration.md` (iteration loop missing), `reviews/2026-05-22-channels-switch-flow.md` (no path to refine), `reviews/2026-05-22-channels-prompt-flow.md` (MIN_THINKING_MS theater), `reviews/2026-05-24-channels-modal.md` (mic icon implies voice that does not exist; chips never adapt). See issues #32, #35.
- **Why it's a rule, not a lens finding:** Four review passes, three different surfaces, same anti-pattern. AI features keep shipping the demo without the loop because there is no rule forcing the question at build time.
- **How to check:** Before shipping any AI-touching surface, answer three questions in the PR description: (a) how does the user revise their input after the first response, (b) what does failure look like to the user, (c) does every implied input modality actually work? If any answer is "we haven't designed that yet", the surface is not ready.
