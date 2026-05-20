import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude API client for the Channels prototype.
 *
 * Architecture note: we run the Anthropic SDK directly in the browser with
 * `dangerouslyAllowBrowser: true` for prototype speed. **This is unsafe for
 * production** — anyone who loads the page can read the API key from the
 * bundle. For deployment to Railway we'll swap to a thin server route that
 * proxies the request and keeps the key server-side. The call shape here is
 * designed so that swap is mechanical: replace `client.messages.create` with
 * a `fetch("/api/categorize", ...)` call returning the same structured payload.
 */

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

const client = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

export const claudeAvailable = !!client;

export type ChannelCategory = {
  title: string;
  tags: string[];
  tone: string[];
  moodColor: string;
  exemplars: Array<{
    title: string;
    year: number;
    oneLine: string;
  }>;
};

const SYSTEM_PROMPT = `You are a content-discovery designer for Netflix. The user is defining a personalized "channel" — a row of recommendations — by describing what they want to watch in natural language.

Your job: turn their description into a structured category that would route to Netflix's Ranker. Return:

- title: A short, evocative row title in Netflix's voice (3-5 words, sentence case, never a tagline). Examples: "Movies you'd watch on a rainy night", "New nostalgia", "Comedies with bite". Avoid generic titles like "Action movies" or "Comedies for you".
- tags: 2-4 canonical genre/theme tags (lowercase, hyphenated). Use existing taxonomy where possible (e.g., "indie-drama", "atmospheric-horror", "coming-of-age"). Invent a new tag only when nothing existing fits.
- tone: 3-5 single-word tone descriptors that bias the ranker (e.g., "warm", "melancholic", "kinetic", "earnest"). Specific over generic.
- moodColor: A single hex color that captures the channel's emotional temperature. Use it sparingly in the UI as a tone hint. Avoid pure red, pure white, pure black.
- exemplars: 6-8 plausibly-real titles that would populate this row. For each: title, year (between 2018 and 2026 unless the prompt is explicitly retrospective), one-line capturing the fit (5-12 words, no marketing copy). Mix well-known and lesser-known titles. These are illustrative, not endorsements.

Voice: Netflix-confident, never cute. No emojis. No "discover" or "binge" language.`;

const TOOL = {
  name: "channel_category",
  description: "Structured category for a Netflix channel based on user description.",
  input_schema: {
    type: "object" as const,
    required: ["title", "tags", "tone", "moodColor", "exemplars"],
    properties: {
      title: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      tone: { type: "array", items: { type: "string" } },
      moodColor: { type: "string" },
      exemplars: {
        type: "array",
        items: {
          type: "object",
          required: ["title", "year", "oneLine"],
          properties: {
            title: { type: "string" },
            year: { type: "integer" },
            oneLine: { type: "string" },
          },
        },
      },
    },
  },
};

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function categorize(
  description: string,
  history: ConversationTurn[] = [],
): Promise<ChannelCategory> {
  if (!client) {
    // No API key — return a deterministic mock so the UI is still demoable.
    return mockCategorize(description);
  }

  const messages: Array<Anthropic.MessageParam> = [
    ...history.map((t) => ({
      role: t.role,
      content: t.content,
    })),
    { role: "user", content: description },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "channel_category" },
    messages,
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a structured category.");
  }
  return toolUse.input as ChannelCategory;
}

/**
 * Mock fallback for when no API key is available. Keeps the demo functional
 * but loses the AI-as-design-material story.
 */
function mockCategorize(description: string): ChannelCategory {
  const seed = description.toLowerCase();
  const isMonster = /monster|horror|scary/.test(seed);
  const isNostalgia = /nostalgia|retro|old/.test(seed);
  const isTeen = /teen/.test(seed);
  const isWarm = /warm|cozy|comfort/.test(seed);

  return {
    title: isMonster
      ? "Monster movies with soul"
      : isNostalgia
        ? "New nostalgia"
        : isTeen
          ? "What teenagers are watching"
          : isWarm
            ? "Soft glow cinema"
            : "Hand-picked for you",
    tags: isMonster
      ? ["horror", "creature-feature", "character-driven"]
      : isNostalgia
        ? ["retro", "coming-of-age"]
        : ["personalized"],
    tone: isMonster
      ? ["atmospheric", "earnest", "tactile"]
      : isWarm
        ? ["warm", "deliberate", "intimate"]
        : ["balanced", "considered"],
    moodColor: isMonster ? "#8B3A3A" : isWarm ? "#D9A45F" : "#5B7CB8",
    exemplars: [
      { title: "Title One", year: 2024, oneLine: "Holds the room without raising its voice." },
      { title: "Title Two", year: 2023, oneLine: "Earns its strangeness frame by frame." },
      { title: "Title Three", year: 2025, oneLine: "Small, exact, unrepeatable." },
      { title: "Title Four", year: 2022, oneLine: "The kind that lingers a week later." },
      { title: "Title Five", year: 2024, oneLine: "Built on character, not concept." },
      { title: "Title Six", year: 2023, oneLine: "A slow burn that pays its debts." },
    ],
  };
}
