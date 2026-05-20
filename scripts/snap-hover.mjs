import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:5173/channels", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
// Hover a tile in the third row (not the default first one)
await page.evaluate(() => {
  // Find a tile that is NOT focused initially by hovering the 3rd item in the "Critically Acclaimed TV Shows" row
  const titleEl = [...document.querySelectorAll("*")].find((n) => n.textContent === "Critically Acclaimed TV Shows");
  if (titleEl) titleEl.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(400);
// Hover the 3rd tile (visually) of that row
const tiles = await page.locator('[class*="MuiBox-root"]').elementHandles();
// Simpler: find an artwork tile within the visible row
await page.mouse.move(900, 350);
await page.waitForTimeout(200);
await page.mouse.move(900, 380);
await page.waitForTimeout(700);
await page.screenshot({ path: "reviews/snaps/channels-tv-1920-hover.png", fullPage: false });
console.log("hover snap done");
await browser.close();
