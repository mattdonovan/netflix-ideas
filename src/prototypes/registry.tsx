import type { ComponentType } from "react";

// SCRIPT ANCHOR: imports (do not remove — `npm run build-idea` inserts above this line)

/**
 * Registry of generated prototypes.
 *
 * Anything created via `npm run build-idea` lands here. The picker on the
 * home page iterates this list to render extra tiles below the hand-coded
 * ones (Discovery, Idea Hopper, Matt), and the router auto-registers a
 * route at `/<slug>` for each entry.
 *
 * The first three top-level tiles on the picker remain hand-coded in
 * App.tsx — those are the canonical prototypes that have earned bespoke
 * tile treatments. Generated prototypes share a single uniform tile
 * shape (glyph + label) so they're visibly secondary.
 *
 * Do not hand-edit entries here; let the generator append them so the
 * file structure stays predictable. You can, of course, hand-tune a
 * generated entry after it's been written.
 */

export type RegisteredPrototype = {
  /** URL-safe slug. Becomes the route at `/<slug>` and the directory under src/prototypes/. */
  slug: string;
  /** Human label for the picker tile. */
  label: string;
  /** Short glyph (1–2 chars or emoji) rendered centered on the tile. */
  glyph: string;
  /** Optional one-line description. Not shown on the picker today; reserved for an info hover. */
  description?: string;
  /** The prototype's top-level component. Rendered at the route. */
  Component: ComponentType;
};

export const registeredPrototypes: RegisteredPrototype[] = [
  // SCRIPT ANCHOR: entries (do not remove — `npm run build-idea` inserts above this line)
];
