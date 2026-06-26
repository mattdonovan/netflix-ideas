import type { ReactNode } from "react";
import { Channels } from "@/prototypes/channels/Channels";

/**
 * Experiment registry.
 *
 * Each experiment is a self-contained React component representing a variant
 * to evaluate side-by-side. The "main" prototype is also registered here so
 * variants can be compared against the canonical version without forking it.
 *
 * Add new experiments by appending to the array. Keep the id stable —
 * comparison URLs reference it (?compare=channels-main,channels-prompt-top).
 *
 * Validation state is a borrowed pattern from the Hawkins team's stated
 * regret about shipping components broadly before stress-testing them in
 * real product context. See context/hawkins/sources/blog-netflix-techblog-godi-2021.md
 * and context/hawkins/notes/operations-and-contribution-model.md ("Outliers").
 * Treat "draft" as Outliers-equivalent: it exists, it can be opened, but it
 * has not yet earned a recommendation against the canonical baseline.
 */

export type ValidationState = "draft" | "validated" | "deprecated";

export type Experiment = {
  id: string;
  name: string;
  description: string;
  /**
   * Short tag (e.g., "layout", "motion", "copy") so the experiments index
   * can group related work.
   */
  tag: string;
  /**
   * Lifecycle marker:
   *  - "draft"      — exists in the registry; not yet evaluated against the baseline
   *  - "validated"  — has been compared and is worth referencing
   *  - "deprecated" — superseded; kept for historical comparison
   */
  validation: ValidationState;
  render: () => ReactNode;
};

export const experiments: Experiment[] = [
  {
    id: "channels-main",
    name: "Discovery — canonical",
    description: "The current main prototype. Use as the baseline for any side-by-side comparison.",
    tag: "baseline",
    validation: "validated",
    render: () => <Channels />,
  },
  // Variants are added here as they're created. Seeded with one placeholder so the
  // registry pattern is visible and the compare view has something to render.
  {
    id: "channels-prompt-top",
    name: "Discovery — prompt at top",
    description: "Variant where the prompt panel slides down from the top of the screen instead of overlaying center. Tests whether top-anchored prompts feel less interruptive on a focused row.",
    tag: "layout",
    validation: "draft",
    render: () => <Channels />, // Placeholder — swap with VariantTopPrompt component when authored.
  },
];

export function getExperiment(id: string): Experiment | undefined {
  return experiments.find((e) => e.id === id);
}
