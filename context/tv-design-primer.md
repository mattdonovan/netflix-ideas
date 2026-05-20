# Designing for TV — a primer

A short course in the surface we're designing for. If you've only designed for web or mobile, the assumptions you carry as defaults will break here. Read this once and refer back when a design decision feels off and you can't say why.

## The five things that change everything

1. **Distance.** The user is 10 feet away, not 18 inches. Everything in the absolute scale shifts — text gets bigger, spacing gets bigger, interactive targets get much bigger. A "comfortable" font size on mobile (16px) is illegible on TV.
2. **No cursor, no touch.** Input is a D-pad: up, down, left, right, select, back. Sometimes a microphone. **There is no hover.** Affordances that depend on hover are dead.
3. **No pixel-level pointing.** The user can't aim. They navigate by hopping between focusable elements. Spatial layout becomes the entire interaction grammar.
4. **Lean-back posture.** The user is on a couch, possibly with a drink, possibly with a partner, possibly half-watching. Cognitive load tolerance is lower than mobile by an order of magnitude. The interface is competing with the show, the room, the conversation. It loses every time.
5. **Output medium is unreliable.** TVs vary wildly in gamma, color calibration, overscan, refresh, viewing angle. The "device" is a category, not a spec.

## The hard rules

### Safe zone
Treat the outer **5% on every edge** as a no-go zone. Nothing important — text, focus rings, primary CTAs — within that margin. Wireframe target: 1920×1080 with content constrained to a 1728×972 inner box.

### Typography
- **Body text floor: 24pt.** Below that, viewers can't comfortably read at couch distance.
- **Recommended body: 28–32px** at 1080p design size.
- **Headings: 48–96px**. Bigger than feels right on a laptop, exactly right on a TV.
- **Line height: generous.** Bump 1.4–1.6× the comfortable web value.
- **Avoid Netflix Sans Bold for body** — Netflix-style headlines use heavy weights for hero copy; body should be Medium or Regular for comfortable scanning.

### Color
- **Never use pure white (#FFFFFF).** It hurts. Use **#F5F5F5** or warmer (`#F1F1F1`–`#EAEAEA`). Netflix's actual UI uses `#F5F5F1`-region whites.
- **Avoid pure black (#000000) for surfaces** — banding artifacts on cheaper panels. Use `#0B0B0B` to `#141414`. Black is OK for *under* content (true cinema feel), but UI chrome breathes better at near-black.
- **Saturated reds bleed.** TVs over-saturate red. If you use Netflix red, use it small, and never for body or fine detail.
- **Cool tones over warm tones.** TVs handle blues/grays more predictably than oranges/reds.

### Line weight
- **Minimum line weight: 2px.** TVs render odd/even scan lines alternately; 1px lines flicker.
- **Even pixel numbers everywhere.** 2, 4, 8, 16. Odd-pixel rendering shimmers.

## Focus — the entire interaction model

There is no cursor. There is exactly one focused element at a time, somewhere on screen, and the user moves it with the D-pad. This makes focus state **not a state, but the primary UI element**. Get this wrong and nothing else matters.

### What focus must do

- **Be unmistakable from across the room.** "Subtle focus" is a contradiction in TV design. Use scale, glow, ring, and contrast together — not one of them alone.
- **Be stable when the eye returns.** A viewer looks away to take a sip, looks back — they should locate the focused element in under one second. If they can't, the focus model failed.
- **Move predictably.** When the user presses → from card A, they should end up on the card to the right of A, every time. Spatial-focus libraries (Norigin Spatial Navigation, Netflix's own internal version) implement this. We'll build a simplified arrow-key-driven version.
- **Animate.** The transition between focused-A → focused-B is the only feedback the user gets. If it snaps, they don't know what happened. 150–250ms ease-out with a slight scale (1.05–1.1×) is the Netflix pattern.

### The "fixed focus, content slides to focus" pattern

A defining Netflix idiom: the focused element stays in roughly the same screen position (e.g., centered horizontally in a row), and the content reel slides underneath it. This is how the Netflix homepage actually works. It reduces the user's eye-travel to ~zero and lets them scan content by feel rather than tracking a moving focus. Steal this for our row interactions.

### No hover
- All hover states must be reconceived as focus states.
- All hover-only affordances (a button that appears on hover, a tooltip, a kebab menu) need to be either always visible, always accessible via D-pad, or banned.

## Motion is the only feedback channel

On mobile you have haptics. On web you have hover and cursor change. On TV you have nothing except **what moves on the screen**. So:

- **Every D-pad input must produce a visible response within ~100ms.** Latency above that feels broken.
- **Selection (Enter / OK press) must produce a momentary state change** distinct from focus — a press-down compression, a brief flash, a slight bounce — so the user knows the input registered even before the action completes.
- **Loading states cannot just spin.** Spinning suggests waiting; on TV that reads as "frozen." Use directional motion — a content row shimmering left to right, a row of placeholder tiles brightening sequentially — to communicate "things are still moving."

## Layout patterns

- **Horizontal rows over vertical lists.** TVs are landscape; eyes track horizontally easier. The Netflix homepage is the canonical example: vertical column of horizontal rows.
- **Low information density.** A laptop dashboard has 50 things visible. A TV screen should have ~5–8 primary objects. The rest is breathing room.
- **One column of attention.** Don't put two columns of equal weight side-by-side. The D-pad makes column-switching expensive cognitively.

## The acceptance heuristic — "the couch test"

Before any TV surface ships, walk to the other side of the room and look at it. Three checks:

1. **Can you tell where focus is in under one second?** If not, the focus treatment isn't loud enough.
2. **Can you read the primary text without leaning forward?** If you lean, you've failed.
3. **Does anything you'd want to interact with sit inside the outer 5%?** If yes, move it.

This heuristic is also a review lens. See `review-lenses.md` → "The Couch Test."

## Sources

- [Designing a 10ft UI — Pascal Potvin, Medium](https://pascalpotvin.medium.com/designing-a-10ft-ui-ae2ca0da08b7)
- [Fire TV Design Guidelines — Amazon](https://developer.amazon.com/docs/fire-tv/design-and-user-experience-guidelines.html)
- [Rethinking User Interface Design for the TV Platform — Toptal](https://www.toptal.com/designers/ui/tv-ui-design)
- [UI/UX on TV Devices — Promwad](https://promwad.com/news/ui-ux-tv-devices-best-practices)
