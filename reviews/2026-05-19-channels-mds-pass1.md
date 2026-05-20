# MDS review — Channels — pass 1 of 2
Date: 2026-05-19
Prototype: Channels
Pass: MDS-only, after sweep #1

## How this review was run

After sweep #1 (cursor restored, RemoteCue de-key-capped, Channels layout switched from `overflow:auto` to column-with-cue-below-rows, TvFrame transform fixed for non-1920 viewports, Home page made responsive), I captured `npm run snap` screenshots at TV 1920×1080, laptop 1440×900, and mobile 390×844, then ran a single-lens MDS pass over **every component, every interaction, and every layout choice** the user can reach today.

MDS lens, in his own words: proportion, restraint, atomic detail, no shipping at 80%. Where a detail would embarrass him in a teardown, name it. Where a token was reused that shouldn't have been, name it. Where a token was *not* used and a one-off ruled, name it.

## The Couch Test (after sweep #1)

- **Focus visible <1s:** pass at TV-1920. Focused tile reads instantly with the 1.08 bloom and bright outline. At laptop the bloom holds.
- **Primary text readable without leaning:** pass on row titles (32pt h3). **Fail** on tile captions (20pt bodySmall in uppercase tracked under each tile) — at 10ft the year and one-line feel like fine print. They're under the 24pt body floor in our own primer.
- **Outer 5% clear:** pass on the safe-box margins. The RemoteCue now sits inside the safe box at the bottom right; it no longer overlaps the last row.

---

## Components

### 1. `TvFrame`

The scaffold for every TV surface. Sets the 1920×1080 canvas, scales to fit, enforces 5% safe-zone margins.

**MDS notes:**
- **Proportion is right** at TV-1920 and laptop-1440 after the unitless-calc fix. At mobile-390 the canvas scales to ~390×220 and the surface becomes unreadable. That isn't an MDS failure of *this* component — the prototype is TV-first — but the design *has not designed for that viewport*. Shipping silence on mobile is shipping at 80%. The honest move: a mobile gate that says "Open on a 1280px+ display" and shows the prototype intent.
- **Letterboxing color:** outer + inner both use `tokens.color.base`. The seam between viewport and canvas is invisible. On a true 10ft viewing setup this is correct; in a browser, it makes the canvas indistinguishable from the page chrome. A 1px hairline at the canvas edge — opacity 0.04 — would communicate "this is the TV frame" without becoming decoration.
- **No transform-origin on outer container** isn't a bug, but the inner has `transform-origin: center` while the outer uses `placeItems: center` — two centering strategies stacked. One would do. Restraint violation: the explicit `transform-origin: center` is the default; remove the line.

### 2. `FocusRing`

The Netflix tile bloom: scale + bright outline + soft shadow on focus.

**MDS notes:**
- **`outline: 4px solid transparent` when unfocused** is here so the transition has something to animate from. Fine in principle. But `outline` doesn't respect `border-radius` reliably across browsers and gives a hard rectangular ring at the corners of rounded cards. Switch to a transformed `box-shadow` ring (`0 0 0 4px color`) so the ring follows the radius. This is a proportion-of-the-corner issue that MDS would notice immediately.
- **Press scale (`focusScale * 0.97`)** is a multiplicative compound. It works, but the press feedback is now a function of two state machines. Cleaner: keep press as an additive transform layer (e.g., `transform: scale(1.08) translateY(2px)` on press, no nested math).
- **Glow color is white** (`focusGlow: rgba(245,245,245,0.24)`). Netflix focus glow on TV is typically tinted by the content beneath, not pure white. Pure white reads as a cursor on TV, not as bloom. Tint the shadow with the mood color of the focused tile, or warm it slightly (`rgba(255, 240, 220, 0.18)`).
- **Ring weight relative to card edge:** the ring is 4px outline plus 4px inset shadow ring = ~8px visual mass. The card has *no* edge of its own (no border, no shadow except focus). Without a resting edge, the focused state reads as if the card just appeared — there's no continuity from unfocused to focused. MDS would ask: where is the card's quiet state? Add a 1px (visual, so 2px in TV space) inset rim at very low opacity so an unfocused tile has *some* edge.

### 3. `Tile`

Poster-shaped focusable card. Title + subtitle below. Optional badge.

**MDS notes:**
- **Subtitle styling is wrong for what it is.** Subtitle holds the year + one-line description (e.g., "2003 · NEON AND LONGING IN EQUAL MEASURE"). Currently rendered as `micro` (14pt) in uppercase tracked. That's a *label* treatment applied to *body content*. At TV distance it becomes unreadable, and the all-caps treatment reads as boilerplate. MDS would say: pick what it is. If it's a metadata stripe, keep the label treatment but cut it to year only. If it's a poster sub-line, drop the uppercase, drop the tracking, raise to `bodySmall` mixed case.
- **Tile sizes (`sm/md/lg`) are 220/260/320 wide at 2:3 ratio.** Netflix TV tiles are predominantly 16:9 for horizontal rows and 2:3 only for the "More Like This" detail view. Defaulting to 2:3 in browse rows is a misreading of the surface. Most Netflix discovery rows show 16:9 boxart. The "warm cinematography" row would visually be 16:9 stills, not 2:3 posters. This is a proportion-of-the-content choice that should match the row's content type. Two tile aspects (`16:9`, `2:3`) are required, not one.
- **Badge "TOP OF ROW"** is decoration. It tells the viewer something they already know (the first tile is the first). MDS: cut it. If a badge slot is needed, reserve it for content data ("NEW", "TOP 10", "BECAUSE YOU WATCHED…"), not row position.
- **Color-block fallback art:** every tile in the prototype today is a single gradient color block. That's been used to avoid shipping copyrighted art, which is correct. But the *design* should still look like a Netflix surface — meaning the color block needs the title baked into the art treatment, not floated as a caption below. Title-baked-into-art is the visual signature of streaming boxart; floated captions read like an iTunes library from 2008. Either render the title inside the tile (overlaid bottom-left, gradient mask) or generate a typographic poster (title set large inside the tile with rotated/scaled type) per channel mood.
- **Opacity transition on caption (`opacity: focused ? 1 : 0.72`)** is a half-step. The caption is either part of the tile or it isn't. At rest the caption sits below the card at 72%; at focus it goes to 100%. That 28% delta is invisible at 10ft and decorative at desk distance. Either commit (e.g., captions only visible on focused tile, fade in/out cleanly) or remove the opacity trick entirely.
- **`flexShrink: 0` on the outer Box** is right for a horizontal reel — but the `width: dims.width` is set in two places (outer Box and inner art Box). Reuse the value once.

### 4. `Row`

Horizontal reel with title + reel + fixed-focus translation.

**MDS notes:**
- **Title opacity gating (`isActive ? 1 : 0.55`)** is the right idea, but the title and the row content fade together. Netflix dims *only the surrounding rows' tiles*, not the row title — the title stays legible so the user always knows what they're orbiting. Decouple: tile group dims, title stays at 1.
- **`fixedFocusOffsetPx = 0` default** means the focused tile sits at the left edge of the row. Netflix's "fixed focus" pattern keeps the focused tile near the *left third*, not at the absolute left, so there's a visible peek of tiles to the left as well as right. Right now, when you arrow right, the left side is empty — the design loses the sense that the row continues in both directions. Set the default to roughly `tile.width * 0.5` or pass it explicitly from Channels.
- **Reel transition** uses `motion.duration.focus` (220ms) for both the tile bloom and the reel slide. The slide should be slightly slower (300ms) so the reel reads as a heavier object. MDS: same duration for unrelated motions is a token-reuse where a new one belonged.
- **`Box` (outer) has no `aria-label` or semantic role.** D-pad navigation works, screen reader does not. TV-product surfaces ship without this. The prototype is allowed to fall short here, but name it.

### 5. `RemoteCue`

Sweep #1 already de-key-capped this. After: a single-line inline cluster of glyph + label pairs, bottom-right of the safe box, at 60% opacity.

**MDS notes:**
- **Glyph "←→" and "↑↓"** as single string tokens is a hack: it lets the cue read as a directional pair, but the two arrows render with no kerning and become a single bricky glyph at small sizes. Either render two separate arrow chars with controlled spacing, or use a single combined glyph like `⇆` / `⇅`.
- **Divider line height (16px) and color (`textTertiary` at 40%)** — the dividers are visible at desk distance and disappear at TV distance. At 10ft you read the row as a single stripe of glyphs without separators. MDS: either commit to dividers and make them visible at TV scale (2px wide, neutral white at 0.12 opacity), or drop them and rely on the gap spacing.
- **Cues never change with context.** The cue list is hardcoded in Channels. Niyati would say: when the user is in the PromptPanel, the cue should change to reflect what's actually possible (Enter to submit, Esc to cancel — *and the cue is already redundant with the inline hint in the panel*, so the cue should hide). Right now the cue persists behind the panel.
- **Idle behavior:** the cue is the same opacity whether the user just landed or has been navigating for two minutes. Real Netflix surfaces fade chrome out as the user demonstrates fluency. The cue should dim further (or hide) after N seconds of input activity, and return on idle.

### 6. `MicState`

Concentric mic visualization with breathe + ripple animations.

**MDS notes:**
- **The mic disc (144×144) sits inside a 200×200 stage.** The 28px gutter exists so ripple rings can travel outward. Fine. But the disc's *radial gradient* uses `accentHover → accent` for active states and `surfaceMid` for idle. Idle reads as a flat gray puck — restraint to a fault. Add a *very* subtle 2px inset edge on idle so the puck has weight when nothing's animating.
- **Ripple keyframes (`scale(1) → scale(1.6), opacity 0.3 → 0`)** push the ring 60% beyond the disc. At 144→230px, the outer ring extends past the 200×200 stage and gets clipped by … nothing — but on a tighter parent it would. Constrain the stage explicitly or accept the spill.
- **Breathe + ripple run simultaneously when listening.** Two periodic motions on the same element fight each other. Pick one — the breathe is the stronger metaphor (a mouth/lung), the ripple is the more obvious "I am detecting." MDS: combining them is shipping at 80%. Choose breathe for listening, ripple for transcribing.
- **`labelForStatus` copy** — "Tap T or press Enter to speak" is the idle prompt. On a TV-prototype that the user has never used speech in, this is fine. But "Tap T" is keyboard-specific; the TV viewer doesn't have a "T" key. Either commit to keyboard demo (and say "Press T") or commit to TV (and say "Press the mic button"). Mixed device language is a restraint failure.
- **`labelForStatus` is uppercase tracked micro**, while the transcript below is h3 mixed case. That label sits awkwardly tiny above large copy. Either pair them as `overline + h3`, or drop the overline entirely (the disc state is already telling you what the system is doing).
- **`MicGlyph` SVG** uses `strokeWidth: 2` which renders at ~4px on TV after upscaling — Netflix iconography on TV uses heavier strokes (~3px source = 6px TV). The icon reads as anemic at TV distance.

### 7. `PromptPanel`

The fullscreen overlay where the user describes the row.

**MDS notes:**
- **Two chip variants in the preview (filled `tags` + outlined `tone`).** MDS: that's two near-identical button variants where one would do. The tag/tone distinction isn't communicated by the chip difference; it's communicated by … nothing. The user has no idea what makes one a tag and one a tone. Either unify (one chip, mixed) or label the groups ("Tags" / "Tone").
- **Input border styling.** Resting state: 2px borderStrong. Focused state: 2px textPrimary. That's a hard contrast jump from gray to bright white on focus. Netflix inputs use a softer transition — a subtle accent or a thicker edge — not a strobe to pure white. Restraint failure.
- **Submit button copy "Use this row".** It's clear, but the verb "use" is engineering language. Diana would say: speak the intent. "Use this row" → "Use it" / "This is right" / "Looks good".
- **Three action buttons (`Use this row`, `Refine`, `Cancel`) all the same size and position.** All three carry equal weight. The primary action and the destructive action shouldn't be visually equivalent. MDS: the cancel should be a text link, not a button. Three buttons of equal weight = three options of equal weight, which they aren't.
- **`history.length / 2` turn counter** lives at the right edge of the action row. Functional, but the copy "0 turn" appears on the very first submission (because `history.length` updates *after* the first turn lands and equals 2, so we get "1 turn"). At the first interaction the user sees "0 turns" or "1 turn" with no context for what a turn is. Either drop the counter for first turn, or relabel ("First take" / "Refining...").
- **No keyboard focus management when the panel opens.** The input gets `autoFocus` via `requestAnimationFrame`, but if focus is in the global focus engine (a tile), nothing in the focus engine knows the panel is up — the engine's keyboard handler ignores INPUT/TEXTAREA so it works, but the active focus is split across two systems. When the panel closes, focus should return to the row that opened it. Right now it returns to wherever the global focus engine last was, which may or may not be visible.
- **No visible "you can refine indefinitely" affordance.** The conversational nature of the prompt is the *whole point* of Channels, per Niyati's earlier review and Frank's reframed lens. Today the panel reads as: ask once, see result, accept/cancel. Refine exists but isn't the central path. MDS: the refine path is shipped at 80% — present but not designed as the *primary* loop.
- **Preview pane height is unbounded.** With 6 exemplars in a 2-column grid, the preview overflows the visible panel area on laptop heights. No scrolling, no constraint. Cards get cut off in the lower-screen.
- **Backdrop blur (24px) + 92% opacity base** is heavy. Compared to Netflix overlays (Title Card detail), this is fine for a *prompt* moment but is closer to a modal than a quick edit. If the design wants this to be lightweight, the backdrop should fade content, not bury it.

### 8. `Header` (inside Channels)

`NF` red wordmark + "CHANNELS — PROTOTYPE" overline + "Matt's profile" right-aligned overline.

**MDS notes:**
- **"NF" as a wordmark is a stand-in for the Netflix N**, but a 2-letter all-caps mark in red is not the Netflix N. It reads as a placeholder. If the brand mark needs restraint, the actual Netflix N has a single recognizable form — use a stylized `N` glyph (or omit the brand mark entirely and rely on the type system). The current `NF` is uncertain about whether it's the Netflix mark or a netflix-ideas mark. Pick.
- **"CHANNELS — PROTOTYPE" overline** is a stage label. It communicates "this is a prototype" to the developer, not to the user the design is rehearsing. On a TV product surface, that overline would never appear. MDS: cut it or relocate it to a corner (e.g., a small "Prototype" tag near the version number, not next to the brand mark).
- **"Matt's profile"** as top-right text is a Netflix-y idea (the active profile chip), but the visual treatment is "uppercase tracked micro" — a label, not a profile chip. Real Netflix shows the avatar tile + name with focusable behavior. Either upgrade to a small avatar + name pair, or remove (the prototype doesn't reach a profile picker, so the affordance is decorative).
- **No vertical alignment between the wordmark and the right-side label.** The wordmark uses `lineHeight: 1` and the right uses default; with `alignItems: center` they should align, but the wordmark is bold-bold and visually dominates. Verify the optical alignment in a snap before declaring done.

### 9. `ChannelRow`, `ChannelTile`, `ChannelMeta` (inside Channels)

Row composition wiring.

**MDS notes:**
- **`ChannelMeta` dot + tone chips.** Mood color rendered as a 12px circle with a 4px outer halo (`boxShadow: 0 0 0 4px ${mood}40`). The halo reads as a macOS minimize button. Restraint failure: the halo doesn't communicate anything that the dot alone wouldn't. Drop the halo.
- **Tone chips rendered inline as text** (`channel.category.tone.slice(0, 3).join(" · ")`) — using "·" as a separator next to the mood dot creates a visual rhythm of dot · dot · dot · dot. At first glance it reads as four dots. Use commas or extra spacing between the mood color and the tone words.
- **`ChannelTile` color generation** combines mood + darken into a 7-step palette, then cycles through it per index. With 6 exemplars and 7 palette entries the pattern is just-barely non-repeating. MDS: a hand-tuned 7-step palette where one would do, or a generated *5-step* with explicit assignment per tile (foreground darker, background lighter). The hand-tuning is invisible to the viewer.
- **Section ID composition (`channel-${channel.id}`)** — works, but the `channels.tsx` keyboard handler checks `activeSectionId.startsWith("channel-")`. A string-prefix coupling between the focus engine and the keyboard handler is a fragile contract. Either type the section ID's domain or move the keyboard handler into the row itself.

### 10. `Home` page (`App.tsx`)

Landing page: title, three cards (Channels, Invite, Experiments), footer.

**MDS notes:**
- **`display: "Two feature prototypes."` at 96pt + period.** The period at this size is a major visual element. MDS: a period after a 96pt headline always feels editorial, but here it has no narrative job — the line is a statement, not a sentence. Cut the period. (Tina would back this up immediately.)
- **Tag/status row inside `PrototypeCard`** uses two near-identical overlines: "PROTOTYPE 1" + "FIRST PASS". They're styled the same except color. With both reading uppercase tracked micro, the eye doesn't know which is the tag and which is the status. Restraint: drop the duplicate visual mass; one overline plus a small accent dot would do.
- **Hover state on `PrototypeCard`:** `translateY(-2px) + border color change`. The 2px lift is too small to feel intentional at desktop scale; it reads as a wiggle. Either commit (4px lift + shadow) or remove (let the border-color change carry the hover).
- **"PROTOTYPE 2" Invite card** at 50% opacity. Disabled state is communicated only by opacity. MDS: at 50% the disabled card still looks clickable to anyone who hasn't tried. A subtle "PLANNED" badge does the work; the opacity is shouting redundantly.
- **Footer line "Click a card or, inside Channels, use ← → ↑ ↓ to navigate · Enter to edit · T to talk · Esc to close".** Too much copy at micro size in tracked uppercase. Restraint failure. This is documentation; it shouldn't sit in the same visual plane as the page. Move it to a `<details>` or a corner badge — or, better, drop it entirely and let the surface teach itself.

### 11. `ExperimentsIndex`, `ExperimentSingle`, `ExperimentCompare`, `ComparePane`, `PillButton`

The experiments sandbox.

**MDS notes:**
- **`ExperimentsIndex` h1 is 64pt at the very top of the page with `mt: sm`.** The h1 reads loud, but the page is a *list* page, not a hero. 64pt is hero scale. Drop to h2 (48pt) and keep h1 for actual hero moments only.
- **Page has a "How to add an experiment" instructional block.** This is developer documentation living inside the user-facing surface. Move it to README.md and drop the block from the page. (A reviewer doesn't need to see the build process.)
- **`PillButton` is named "Pill"** but uses `radius.sm` (4px) — it's a square button, not a pill. The name is wrong. Either restyle it as a pill (radius.pill, 999) or rename.
- **`ComparePane` label** is positioned `top-left` at low contrast in a "rgba(11,11,11,0.7)" pill. Visible but reads as a sticker. The two panes need clearer ownership of their identity — a thin top stripe (4px) per pane in tinted color, or simply better contrast on the label.
- **Compare divider is 2px borderStrong** — at TV distance it's a hair. MDS: the divider has a structural role (this side vs that side) and deserves more weight. 4px and slightly brighter, or a soft gradient that lifts in the middle.

### 12. `ActionButton`, `Chip` (inside PromptPanel)

Local primitives that should probably live in `primitives/`.

**MDS notes:**
- **`ActionButton`** is inline in PromptPanel. It overlaps in purpose with MUI's `<Button>` (which the theme already configures). Either use the MUI button (and respect the system), or extract `ActionButton` into `primitives/` and stop drawing the same primitive twice. MDS: "where did you reach for an extra element where the existing one would have carried the moment?" — exactly this.
- **`Chip`** similarly duplicates the MUI Chip the theme already configures. Same critique.

### 13. `MicGlyph`

Inline SVG for the mic icon.

**MDS notes:**
- **`strokeWidth: 2`** reads anemic at TV scale (see MicState). Bump to 2.5 or 3.
- **24×24 viewBox rendered at 48×48** — fine for HiDPI sharpness, but the icon could be larger inside the disc. Currently 48px inside a 144px disc = 33% of the disc. Paul Rand: the symbol should occupy more of the field. Bump to 64–72px inside the disc.

---

## Interactions

### Arrow keys
- Works. **Vertical movement** between rows snaps; horizontal slides via reel translateX. Diagonal motion is impossible (no two-axis input). For TV that's correct.
- **Edge behavior:** at the last row, ArrowDown silently does nothing. No bounce-back, no visual cue that the user hit the edge. MDS would ask for a tiny dampened bounce (8px) to signal "you're at the edge" without scrolling. Currently shipping at 80%.

### Enter / Space
- Invokes the focused item's `onSelect`. Works.
- **No press feedback on the focused tile.** Enter fires, the panel opens, but the tile itself doesn't visibly *press down*. The press state in FocusRing (`pressed=true` scaling to `focusScale * 0.97`) is defined but no caller wires it up. The "press" state was designed and not used. Shipping at 80%.

### T (talk)
- Opens the PromptPanel for the currently focused channel. Works in Channels.
- **Single-letter shortcuts on TV** don't exist (TVs have no T key). On a real TV remote this would be the mic button. On the prototype's keyboard demo it's plausible. The cue says "T" which is keyboard-language. MDS: pick the device. The prototype's whole conceit is TV, so the demo should explain "Press 'T' (stands in for mic button on a real remote)" — or simply omit and let the mic button glyph in the cue carry the affordance.

### Escape
- Closes the prompt panel. Works.
- **No focus return.** When Escape closes the panel, focus does not return to the channel that opened it. The global focus engine continues from wherever it left off. The user feels mildly lost.

### Hover (Home, Experiments)
- Cards translateY -2px on hover. See PrototypeCard note above.
- **Tiles inside Channels have no hover handler** — they're keyboard-only. On desktop a click-tap doesn't focus or activate them. Either wire mouse-as-focus (hover → setFocus, click → invokeSelect) or hide the cursor in Channels (but the user just told us they need the cursor visible). Restraint here means: wire the mouse to behave like a remote — hover = focus, click = OK.

### Focus bloom transition
- 220ms, ease-out-quart-ish. Feels right at TV.
- **The bloom transitions `transform` and `box-shadow`** but not `outline`. The outline appears instantly; the bloom and shadow ease in. Mixed timing = janky-looking focus at slow-motion. Either transition outline (`outline-color`) too, or drop the outline in favor of a shadow-only ring that participates in the easing.

### PromptPanel fade-in
- `fadeIn` keyframe over 400ms ease. Works.
- **Content inside the panel doesn't choreograph in.** Title, mic, input all appear at once when the opacity hits 100. Frank's lens (the reframed one) wants the *becoming* to be present. Stagger: title in first (0ms), mic at 100ms, input at 200ms — choreograph the moment of entry. Currently it's a fade-in of a static composition.

### Row reel translateX
- 220ms ease. See Row notes — should be slower.

### MicState breathe / ripple
- Run simultaneously when listening. See MicState notes — pick one per state.

### Submit prompt (Enter on input)
- Works. Calls categorize().
- **No optimistic UI.** The user submits and sees "Asking the Ranker" then a hard cut to preview. MDS would split this — let the title resolve typographically as the categorize response streams in, like a typewriter or a fade-up of resolving text. The current "submit then wait then reveal" is shipped at 80%.

### Refine
- Returns to idle, focuses input. Works.
- **But the preview is gone.** When you refine, you can't see what you're refining away from. The previous result vanishes. MDS: the refine flow needs the previous state visible (smaller, dimmed) while the new prompt is being authored, so the user can see what they're tweaking *from*.

### Cancel
- Closes panel. Works.
- **No confirmation when the user has authored substantial content** (e.g., 3 turns in). A click on Cancel discards the conversation. For a quick prompt this is fine; for a multi-turn session it's destructive. Either guard, or have Cancel mean "save my draft for this channel and close" by default.

### "Use this row"
- Calls onAccept(category) → updates Channel + closes panel. Works.
- **No celebratory moment.** Per Frank's reframed lens (capacity for change) and per the first review's "design the moment of revelation" — accepting a new row should be the loudest moment in the prototype. Currently the panel closes and the row updates in place with no animation. The new tiles just appear. MDS: the moment of becoming is shipping at 0%, not 80%. This is the single biggest gap.

### Compare-vs-canonical
- Renders two experiments side-by-side in 50/50 split. Works.
- **No way to swap which one is on which side without editing the URL.** Minor.

---

## Layout choices

### TvFrame placing 1920×1080 canvas centered
- Right call for a TV prototype on desktop.
- Wrong call for mobile — see TvFrame notes. Layout is silent at small viewports.

### Safe-zone marginX (96) / marginY (54) inside canvas
- Matches the 5% Fire TV spec. Correct.
- **But content inside has no internal padding.** The safe-box is the *outer* edge of the safe area; content can still extend to that edge. The Channels Header sits at the very top-edge of the safe box; the rows below have no extra vertical breath. MDS would add another 24px internal padding so content doesn't hug the safe-box edge.

### Channels column layout (Header / Rows / RemoteCue)
- After sweep #1 this works. The cue sits below the rows now.
- **Three rows fit comfortably at TV-1920** but **only one to one-and-a-half rows visible at laptop-1440** because the canvas is now scaled to 75% — vertical space is constrained. The design assumes 1080 vertical pixels of canvas but desktop dev experience constantly works at 900px or less. Either scale the row vertical rhythm responsively, or render fewer seed rows by default (2 instead of 3) so the laptop experience isn't half-cut.

### Channels row vertical gaps via flex `gap: lg` (32px in design units)
- Reasonable. With the row's internal `paddingBlock: sm` (16px), focus bloom has 32+16=48px of breath above and below. Bloom is 8% × 390px tile ≈ 31px vertical extension. Fits.

### Row: title above reel
- Standard. Works.
- **Title slot for `ChannelMeta`** sits inline with the title at `baseline` alignment. The meta dot is 12px, the title is 32pt — the dot's vertical position is fragile across browsers. Make it a small inline tag, not a free-floating dot.

### Tile: art above caption
- See Tile notes. Caption-below-art is iTunes-2008, not Netflix-2024. Move title into the art.

### PromptPanel: centered fullscreen overlay
- The center-vertical alignment forces a specific reading order: title at top, mic in middle, input below. Works for the idle state.
- **Preview state replaces input and pushes layout down.** The preview pane is 6 exemplars in 2 columns — at standard heights this exceeds the available space and gets cut. The panel doesn't scroll. MDS: either constrain preview to 4 exemplars at most, or design a scroll affordance for the preview itself.

### Home: column → responsive grid
- After sweep #1, the breakpoints are right. The cards fold to a single column at xs.
- **Hero typography (`display` size 96pt) at mobile** still renders as 48pt per the sx prop, but the line breaks awkwardly ("Two feature / prototypes."). The headline should be tighter at mobile or rewritten.

### Experiments: max-width container, 2-col grid
- Works for now. At narrow widths the 2-col grid is hardcoded — should fold to 1 column under, say, 720px. Currently the grid will just compress and the cards become unreadable.

### Compare: 50/50 split with 2px divider
- See ComparePane / divider notes above.

---

## The single biggest opportunity (this pass)

**Design the moment of acceptance as a *transformation*, not a state-change.** Every other gap in this review is local. This one is structural: the user says something, the row becomes something — that becoming is the entire product. Today it happens silently in a single render. Until that moment carries its own choreography, the prototype is a settings panel that updates a list, not a Netflix surface authoring itself.

This was named in the first review as the single biggest opportunity and remains true. Sweep #2 must address it.

---

## Sweep #2 targets (ordered by priority)

1. **Tile content treatment** — title baked into art (or generated typographic poster), drop floated caption, drop "TOP OF ROW" badge.
2. **Acceptance moment** — accept now choreographs: panel slides away, the row title resolves character-by-character, the tiles cross-fade from old to new, the focus ring re-blooms.
3. **Caption / metadata typography** — pull captions out of label-treatment-on-body, raise above 24pt floor, drop the uppercase tracked styling on tile metadata.
4. **FocusRing → box-shadow ring** — drop outline (corner-radius bug). Tint glow with mood color. Add resting edge to unfocused tiles.
5. **Header restraint** — drop "NF" wordmark stand-in OR replace with proper N glyph; drop "CHANNELS — PROTOTYPE" overline.
6. **RemoteCue** — fix arrow rendering (separate glyphs or use ⇆/⇅), idle-fade behavior, hide while PromptPanel is open.
7. **PromptPanel** — preview-pane height constraint, return-focus on close, refine-shows-previous, cancel-is-text-link, choreograph entry stagger.
8. **MicState** — pick breathe OR ripple per state. Heavier mic glyph. Drop the "Tap T" device-language hedge.
9. **ChannelMeta** — drop the macOS-dot halo on mood color.
10. **Home** — drop "Two feature prototypes." period. Drop footer doc-strip.
11. **Mobile gate** — explicit "Open on 1280px+" message at narrow widths.
12. **Experiments** — drop "How to add an experiment" block; demote h1 to h2; fix PillButton naming or radius.
13. **Press state** — wire up the FocusRing pressed prop on Enter, since the design exists and was never connected.
14. **Edge-of-row dampened bounce** at navigation edges.
15. **ActionButton / Chip** — collapse into theme'd MUI components or extract into `primitives/`.

This is a long list. Sweep #2 will execute 1–8 (the structural and most-visible ones) and defer 9–15 to a sweep #3 or note them as backlog.
