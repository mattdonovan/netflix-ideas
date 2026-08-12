# Catch Up

**Route:** [`/catch-up`](http://localhost:5173/catch-up)

Household watch state, on the Netflix TV surface.

## The problem

Netflix knows what each *profile* watches and nothing about which profiles
watch *together*. Two people who watch a show side by side have to pick whose
account it lives in; the other one either loses their place or hops profiles to
find it. "Whose profile did we start this from? Where were we?" is friction
Netflix's own data model creates.

## The feature

One new verb: **Jump**. It moves *your own* marker to a point on the timeline.
That's the whole thing — it puts you at the same point someone else is at, and
does nothing else.

- **Nothing is shared or merged.** Reading another member's position is the
  only cross-profile operation, and it's read-only. Watching under your account
  updates only your timeline; someone jumping to your spot updates only theirs.
- **Nothing is written to your viewing history.** Jumping doesn't mark episodes
  watched. Only the marker moves.
- **Play is untouched.** It always resumes your own position. There is no
  dialog between a member and the thing they wanted to watch.
- **Jumping never destroys history.** Jump backwards and the marker moves;
  nothing is removed. That's why it's "Jump" and not "Catch up" — it goes both
  directions.
- **Jump absorbs "Watch from beginning"** rather than sitting beside it. Every
  destination is a place on one timeline, so they belong in one list. When
  nobody else in the household is on a title there's nothing to fan out to and
  the control doesn't render at all.

## Where it lives

- **Billboard, cards, and detail view** — a **Jump** button beside Play,
  wearing the stacked avatars of the people you can jump to. Hovering stacks
  the destinations upward at the same size as the button: `Dana: S3:E8`,
  `Kids: S1:E1`, and `Beginning` (only while you're resuming — if you haven't
  started, Play already starts there). No dialog, no confirmation: one hover,
  one click.
- **Cards carry the same face pile in the top-right corner**, on focused and
  collapsed cards alike and without waiting for a hover — who else is on a
  title is something you scan a row for. It shows *other* members only: your
  own face on your own card says nothing you didn't already know. That pile is
  the only household signal — there are no badges, and card copy is the show's
  own description rather than a household status line.
- **Play and Jump only appear on card hover**, so a row at rest is a wall of
  artwork — which is what the TV layout is for.
- **The white ring is a pointer signal, not a state one.** The focused card
  already announces itself by being the wide landscape one; ringing it at rest
  would answer a question the layout has already answered. The ring means "a
  click would land here".
- **The card's Play and Jump are the same size as the billboard's.** They sit
  on artwork at the same distance from the viewer; sizing them by their
  container would make the card's controls read as a lesser class of button.
- **Detail view** — the household timeline: one bar, one pip per member. Click
  a pip to jump there.
- **Rows** — mostly ordinary browsing. Only *Catch up on* is built from the
  household; the rest are the shelves any Netflix home has. That ratio is the
  design: a face pile has to be something you come across for it to mean
  anything. Filter every row by household activity and every card carries a
  pile, at which point the signal is just wallpaper. About one card in five
  outside the *Catch up on* row shows one.

## What's synthesized

Everything. There's no backend: each member's position is derived from a hash
of `title + memberId`, so it's stable across reloads and consistent wherever a
title appears. Season counts are read back out of the same string the row and
detail metadata display, so the timeline and the info block agree.

**Overlap is deliberately rare** — about one title in five has anyone else in
the house on it, and most of those have exactly one person. Overlap is the
point of the surface, but a household where everyone has started everything is
one where "Kristin is on this too" carries no information. `The Boroughs` is
pinned as always-shared so the hero has a known-good lead instead of depending
on which hashes happened to line up.

Household photos come from TMDB, the same source as the catalog artwork, so no
third-party imagery is vendored into the repo. They stand in for real people —
Kristen Bell's headshot is playing Kristin.

Rows lead with **Continue watching**. Catch Up is a surface about the house,
but the first thing anyone opens Netflix to do is get back to what they were
already watching; burying that under three household rows would be a feature
arguing with a habit.

## Not built

- **The player** — a scrubber with household pips, and a third home for Jump.
- **The episodes list** — everything is currently shaped like a movie.
- **Household visibility admin** — who can see whose progress is a setting
  configured once in account settings, not a per-title choice, so there are
  deliberately no share/hide controls on cards here.
