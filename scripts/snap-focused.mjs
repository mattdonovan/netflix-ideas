#!/usr/bin/env node
/**
 * Capture a Channels snap with the focus engine pushed past the hero into a
 * row, so reviewers can see the focused-tile expansion (Figma 109-9726) in
 * isolation. Press ArrowDown once → focus jumps onto the first row.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SNAP_BASE_URL ?? "http://localhost:5173";
const OUT = path.resolve(process.cwd(), "reviews/snaps");
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/channels`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  // Scroll the row into view, then take a viewport-sized shot centered on it.
  await page.evaluate(() => window.scrollTo({ top: 480, behavior: "instant" }));
  await page.waitForTimeout(400);
  const file = path.join(OUT, "channels-focused-row.png");
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ focused row → ${path.relative(process.cwd(), file)}`);
  await ctx.close();
} finally {
  await browser.close();
}
