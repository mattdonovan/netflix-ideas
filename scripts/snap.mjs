#!/usr/bin/env node
/**
 * Capture full-page screenshots of every prototype route at TV, laptop, and
 * mobile sizes. Saves to reviews/snaps/<route>-<viewport>.png so review passes
 * can reference real pixels instead of imagined ones.
 *
 * Usage:
 *   npm run snap                  # all routes, all viewports
 *   npm run snap -- /channels     # only one route
 *
 * Requires the dev server to be running on http://localhost:5173.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SNAP_BASE_URL ?? "http://localhost:5173";
const OUT = path.resolve(process.cwd(), "reviews/snaps");

const ALL_ROUTES = [
  { path: "/", name: "home" },
  { path: "/channels", name: "channels" },
  { path: "/experiments", name: "experiments" },
];

const VIEWPORTS = [
  { name: "tv-1920", width: 1920, height: 1080 },
  { name: "laptop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];

const argRoute = process.argv[2];
const routes = argRoute
  ? ALL_ROUTES.filter((r) => r.path === argRoute || r.name === argRoute)
  : ALL_ROUTES;

if (routes.length === 0) {
  console.error(`No route matched "${argRoute}". Known routes: ${ALL_ROUTES.map((r) => r.path).join(", ")}`);
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  for (const route of routes) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const url = `${BASE}${route.path}`;
      await page.goto(url, { waitUntil: "networkidle" });
      // Give CSS transitions, fonts, and the focus engine a beat to settle.
      await page.waitForTimeout(800);
      const file = path.join(OUT, `${route.name}-${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`✓ ${route.name} @ ${vp.name}  →  ${path.relative(process.cwd(), file)}`);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
