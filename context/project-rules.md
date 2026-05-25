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

<!-- First rule lands here. Empty body is intentional. -->
