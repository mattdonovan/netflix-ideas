import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude client for the Channels prototype, with two paths:
 *
 * - **Production** (Railway): the calls below POST to `/api/*` routes served by
 *   `server/index.mjs`, which holds `ANTHROPIC_API_KEY` server-side. The key is
 *   never in the browser bundle.
 * - **Local dev** (`vite`): we talk to Claude in-browser with the SDK and
 *   `VITE_ANTHROPIC_API_KEY` for speed. That whole branch is gated on
 *   `import.meta.env.DEV`, so the prod build dead-code-eliminates the key
 *   reference — it cannot leak into the deployed bundle.
 *
 * Either way, if a call can't be made (no key, network error) we fall back to a
 * deterministic mock so the demo still works.
 */

const useServer = import.meta.env.PROD;
// Read the dev key only in dev so the reference is stripped from prod builds.
const apiKey = import.meta.env.DEV ? import.meta.env.VITE_ANTHROPIC_API_KEY : undefined;

const client = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null;

export const claudeAvailable = useServer || !!client;

async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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
  if (useServer) {
    const r = await postJson<ChannelCategory>("/api/categorize", { description, history });
    return r ?? mockCategorize(description);
  }
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
 * Compress an arbitrary free-text prompt into a 3-5 word, words-only title.
 * Used by the Switch Channels flow: while the AI thinks the row's title
 * cycles through loading messages, then settles on the result of this call.
 *
 * The model is told to silently fix typos / punctuation. We additionally
 * sanitize the response client-side to strip wrapping quotes, trailing
 * punctuation, and any word past the 5th.
 */
const TITLE_SYSTEM_PROMPT = `You are renaming a Netflix-style row based on a user's prompt. Return ONLY a 3 to 5 word title in sentence case, words only. No punctuation, no quotes, no emojis, no trailing period. Capture the spirit of the prompt without echoing it verbatim. Fix typos and weird punctuation silently. Aim for evocative over literal.

Examples:
- "shows my dad would secretly love" → Quiet shows for dads
- "stuff to watch when drunk lol" → Late night comfort watches
- "moody horror but not gory" → Atmospheric quiet horror
- "things from when I was a teen 2010s" → Soft 2010s nostalgia`;

export async function summarizePromptToTitle(prompt: string): Promise<string> {
  if (useServer) {
    const r = await postJson<{ title: string }>("/api/summarize", { prompt });
    return (r && sanitizeTitle(r.title)) || mockSummarize(prompt);
  }
  if (!client) {
    return mockSummarize(prompt);
  }
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      system: TITLE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return mockSummarize(prompt);
    return sanitizeTitle(block.text) || mockSummarize(prompt);
  } catch {
    return mockSummarize(prompt);
  }
}

/**
 * Tune a row to a concrete, ordered set of titles drawn from the *real*
 * catalog. The candidate list (every catalog entry that has artwork) is passed
 * in from the UI; Claude is told to pick ~12 that match the user's prompt and
 * to copy the titles verbatim, so every pick resolves through `findInCatalog`
 * and renders real Netflix art. Games are eligible. Returns both a 3-5 word row
 * title and the ordered picks. Falls back to a deterministic keyword match when
 * no API key is present so the demo still fills with real content.
 */
export type TunedChannel = {
  title: string;
  picks: Array<{ title: string; year?: number }>;
};

export type TuneCandidate = {
  title: string;
  year?: number;
  kind: string | null;
};

const TUNE_SYSTEM_PROMPT = `You are tuning a single Netflix row to a viewer's request. You are given a CANDIDATE catalog of titles that are actually available. Select about 12 of them that best match the request, ordered best-first. You may mix movies, series, and games when they fit the request. Only pick titles that appear in the candidate list, and copy each title verbatim (same spelling, same casing). Also return a short, evocative row title (3-5 words, sentence case, no punctuation, no quotes) that captures the request without echoing it literally. Avoid generic titles like "Action movies".`;

const TUNE_TOOL = {
  name: "tune_channel",
  description: "Select catalog titles for a tuned Netflix row.",
  input_schema: {
    type: "object" as const,
    required: ["title", "picks"],
    properties: {
      title: { type: "string" },
      picks: {
        type: "array",
        items: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            year: { type: "integer" },
          },
        },
      },
    },
  },
};

export async function tuneChannel(
  prompt: string,
  candidates: TuneCandidate[],
): Promise<TunedChannel> {
  if (useServer) {
    const r = await postJson<TunedChannel>("/api/tune", { prompt, candidates });
    if (!r) return mockTune(prompt, candidates);
    return {
      title: sanitizeTitle(r.title) || mockSummarize(prompt),
      picks: Array.isArray(r.picks) ? r.picks : [],
    };
  }
  if (!client) {
    return mockTune(prompt, candidates);
  }
  try {
    const catalogList = candidates
      .map((c) => `- ${c.title}${c.year ? ` (${c.year})` : ""} [${c.kind ?? "title"}]`)
      .join("\n");
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: TUNE_SYSTEM_PROMPT,
      tools: [TUNE_TOOL],
      tool_choice: { type: "tool", name: "tune_channel" },
      messages: [
        {
          role: "user",
          content: `Request: ${prompt}\n\nCANDIDATE catalog:\n${catalogList}`,
        },
      ],
    });
    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return mockTune(prompt, candidates);
    }
    const result = toolUse.input as TunedChannel;
    return {
      title: sanitizeTitle(result.title) || mockSummarize(prompt),
      picks: Array.isArray(result.picks) ? result.picks : [],
    };
  } catch {
    return mockTune(prompt, candidates);
  }
}

function mockTune(prompt: string, candidates: TuneCandidate[]): TunedChannel {
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const wantsGames = /\bgames?\b/.test(prompt.toLowerCase());
  const scored = candidates
    .map((c) => {
      const hay = c.title.toLowerCase();
      let score = words.reduce((s, w) => (hay.includes(w) ? s + 1 : s), 0);
      if (wantsGames && c.kind === "game") score += 1;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score);
  // If nothing matched, fall back to a stable slice so the row still fills.
  const picks = (scored[0]?.score ? scored.filter((s) => s.score > 0) : scored)
    .slice(0, 12)
    .map(({ c }) => ({ title: c.title, year: c.year }));
  return { title: mockSummarize(prompt), picks };
}

function sanitizeTitle(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/^["'`“”‘’]+|["'`“”‘’.,!?]+$/g, "")
    .trim();
  return trimmed.split(/\s+/).slice(0, 5).join(" ");
}

function mockSummarize(prompt: string): string {
  const words = prompt.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  return words.slice(0, 4).join(" ") || "New channel";
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
