import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto("http://localhost:5173/channels", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
// Hover the second tile of the first row
const tiles = await page.locator('[data-focusable-tile]').elementHandles();
console.log(`Found ${tiles.length} tiles`);
if (tiles.length > 1) {
  await tiles[1].hover();
  await page.waitForTimeout(500);
  const info = await tiles[1].evaluate((el) => {
    const r = el.getBoundingClientRect();
    const card = el.querySelector('div'); // first child = card
    const cardRect = card ? card.getBoundingClientRect() : null;
    const html = el.innerHTML.length;
    const hasPanel = el.innerHTML.includes("MuiBox-root");
    // count children of card
    const cardChildren = card ? card.children.length : 0;
    return { slotRect: { x: r.x, y: r.y, w: r.width, h: r.height }, cardRect, htmlLen: html, cardChildren };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: "reviews/snaps/inspect-tile.png", fullPage: false });
}
await browser.close();
