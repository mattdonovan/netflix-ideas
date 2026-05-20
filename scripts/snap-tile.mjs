#!/usr/bin/env node
/**
 * Take a zoomed-in screenshot of the first focused tile so we can verify
 * the expansion panel renders all three sections (controls + meta + tags).
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
  await page.evaluate(() => window.scrollTo({ top: 540, behavior: "instant" }));
  await page.waitForTimeout(400);
  const file = path.join(OUT, "channels-tile-zoom.png");
  await page.screenshot({ path: file, clip: { x: 80, y: 100, width: 540, height: 700 } });
  console.log(`✓ tile zoom → ${path.relative(process.cwd(), file)}`);
  await ctx.close();
} finally {
  await browser.close();
}
