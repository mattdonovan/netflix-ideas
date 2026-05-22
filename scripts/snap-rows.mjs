#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SNAP_BASE_URL ?? "http://localhost:5173";
const OUT = path.resolve(process.cwd(), "reviews/snaps");

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/channels`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, "rows-rest.png"), fullPage: false });

  // Hover the right chevron so it lights up
  const next = page.locator('button[aria-label="Next page"]').first();
  await next.hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "rows-hover-right.png"), fullPage: false });

  // Advance to page 2
  await next.click({ force: true });
  await page.waitForTimeout(800);
  const prev = page.locator('button[aria-label="Previous page"]').first();
  await prev.hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "rows-page2.png"), fullPage: false });

  // Card hover on page 0 (reset first)
  await prev.click({ force: true });
  await page.waitForTimeout(800);
  const tile = page.locator('[data-focusable-tile]').nth(2);
  await tile.hover();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, "rows-cardpop.png"), fullPage: false });

  console.log("Done");
  await ctx.close();
} finally {
  await browser.close();
}
