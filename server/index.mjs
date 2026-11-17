import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Production server for Railway. Serves the built SPA from `dist/` and proxies
 * the Claude calls so the Anthropic key stays server-side — it is read from
 * `ANTHROPIC_API_KEY` (a Railway service variable / local .env) and never
 * shipped to the browser. The client (`src/lib/claude.ts`) calls these routes
 * in production; in local `vite` dev it talks to Claude in-browser instead.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const PORT = process.env.PORT || 3001;
const MODEL = "claude-haiku-4-5-20251001";

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

const TUNE_SYSTEM_PROMPT = `You are tuning a single Netflix row to a viewer's request. You are given a CANDIDATE catalog of titles that are actually available. Select about 12 of them that best match the request, ordered best-first. You may mix movies, series, and games when they fit the request. Only pick titles that appear in the candidate list, and copy each title verbatim (same spelling, same casing). Also return a short, evocative row title (3-5 words, sentence case, no punctuation, no quotes) that captures the request without echoing it literally. Avoid generic titles like "Action movies".`;

const TUNE_TOOL = {
  name: "tune_channel",
  description: "Select catalog titles for a tuned Netflix row.",
  input_schema: {
    type: "object",
    required: ["title", "picks"],
    properties: {
      title: { type: "string" },
      picks: {
        type: "array",
        items: {
          type: "object",
          required: ["title"],
          properties: { title: { type: "string" }, year: { type: "integer" } },
        },
      },
    },
  },
};

const TITLE_SYSTEM_PROMPT = `You are renaming a Netflix-style row based on a user's prompt. Return ONLY a 3 to 5 word title in sentence case, words only. No punctuation, no quotes, no emojis, no trailing period. Capture the spirit of the prompt without echoing it verbatim. Fix typos and weird punctuation silently. Aim for evocative over literal.`;

const CATEGORY_SYSTEM_PROMPT = `You are a content-discovery designer for Netflix. The user is defining a personalized "channel" — a row of recommendations — by describing what they want to watch in natural language. Turn their description into a structured category. Voice: Netflix-confident, never cute. No emojis.`;

const CATEGORY_TOOL = {
  name: "channel_category",
  description: "Structured category for a Netflix channel based on user description.",
  input_schema: {
    type: "object",
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
          properties: { title: { type: "string" }, year: { type: "integer" }, oneLine: { type: "string" } },
        },
      },
    },
  },
};

const app = express();
app.use(express.json({ limit: "1mb" }));

// Returns false (and a 503) when the server has no key — the client falls back
// to its own deterministic mock so the demo still works.
function ready(res) {
  if (!client) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
    return false;
  }
  return true;
}

app.post("/api/tune", async (req, res) => {
  if (!ready(res)) return;
  const { prompt = "", candidates = [] } = req.body ?? {};
  try {
    const catalogList = candidates
      .map((c) => `- ${c.title}${c.year ? ` (${c.year})` : ""} [${c.kind ?? "title"}]`)
      .join("\n");
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: TUNE_SYSTEM_PROMPT,
      tools: [TUNE_TOOL],
      tool_choice: { type: "tool", name: "tune_channel" },
      messages: [{ role: "user", content: `Request: ${prompt}\n\nCANDIDATE catalog:\n${catalogList}` }],
    });
    const tu = r.content.find((b) => b.type === "tool_use");
    res.json(tu ? tu.input : { title: "", picks: [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const INTERPRET_SYSTEM_PROMPT = `You edit a viewer's description for a Netflix browsing tool. You get the current description, its settings as "dim=value", the allowed settings as "dim: value, value, …", and what the viewer just typed. Decide what they meant as an edit to the description:
- "set": settings to add or change (a dim already present gets the new value). Use ONLY dims and values from the allowed list. Two dims are open: "person" (an actor or filmmaker's full name, correctly spelled) and "keyword" (a short lowercase subject like "time travel").
- "remove": dims to drop, when the viewer loosens something ("or anytime" drops era, "doesn't have to be scary" drops scare, "any mood" drops tone). Never remove "format" or "story".
Typed text often refers to the existing description ("or anytime", "make it funnier", "but not so dark"); read it against the whole description. Never use anything that describes how a story ends or what happens in it. If nothing fits, return empty lists.`;

const INTERPRET_TOOL = {
  name: "edit_description",
  description: "The edit the viewer's typed words make to the description.",
  input_schema: {
    type: "object",
    required: ["set", "remove"],
    properties: {
      set: { type: "array", items: { type: "object", required: ["dim", "value"], properties: { dim: { type: "string" }, value: { type: "string" } } } },
      remove: { type: "array", items: { type: "string" } },
    },
  },
};

// Discovery composer: typed words that didn't match locally → an edit to the description.
app.post("/api/interpret", async (req, res) => {
  if (!ready(res)) return;
  const { text = "", vocab = "", sentence = "", current = "" } = req.body ?? {};
  try {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: INTERPRET_SYSTEM_PROMPT,
      tools: [INTERPRET_TOOL],
      tool_choice: { type: "tool", name: "edit_description" },
      messages: [{ role: "user", content: `Description: ${String(sentence).slice(0, 400)}\nSettings: ${String(current).slice(0, 400)}\n\nAllowed settings:\n${vocab}\n\nViewer typed: ${String(text).slice(0, 300)}` }],
    });
    const tu = r.content.find((b) => b.type === "tool_use");
    res.json(tu ? tu.input : { set: [], remove: [] });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/summarize", async (req, res) => {
  if (!ready(res)) return;
  const { prompt = "" } = req.body ?? {};
  try {
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 50,
      system: TITLE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    const t = r.content.find((b) => b.type === "text");
    res.json({ title: t ? t.text : "" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/categorize", async (req, res) => {
  if (!ready(res)) return;
  const { description = "", history = [] } = req.body ?? {};
  try {
    const messages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: description },
    ];
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: CATEGORY_SYSTEM_PROMPT,
      tools: [CATEGORY_TOOL],
      tool_choice: { type: "tool", name: "channel_category" },
      messages,
    });
    const tu = r.content.find((b) => b.type === "tool_use");
    if (!tu) return res.status(500).json({ error: "no tool use" });
    res.json(tu.input);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Serve the built SPA + a catch-all so client-side routes resolve to index.html.
app.use(express.static(distDir));
app.use((_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
