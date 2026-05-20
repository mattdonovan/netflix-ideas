# netflix-ideas

Two Netflix feature prototypes built as TV experiences with a Hawkins-flavored Material UI theme.

- **Channels** — Replace predefined recommendation rows with user-defined channels. Speak or type, AI assigns a category, content fills in.
- **Invite** — Share a show/movie via QR → friend opens a mobile companion page → watches a sample free → joins your recommendation graph.

See `original-prompt.md` for the project genesis, `context/` for research and review lenses.

## Stack

Vite · React · TypeScript · Material UI · Anthropic SDK

## Develop

```bash
cp .env.example .env  # then paste your Anthropic API key
npm install
npm run dev
```

## Surfaces

- Primary: **TV** (10-foot, D-pad navigation via arrow keys, 5% safe zone).
- Secondary: **Mobile** for the Invite companion page only.

## Repo layout

```
context/      Research and review lenses
reviews/      Generated review passes against the prototypes
src/          App code
  theme/      Hawkins-flavored MUI theme
  primitives/ Row, Tile, FocusRing, Channel, MicState
  prototypes/ Channels, Invite
  experiments/ Side-by-side variant sandbox
```
