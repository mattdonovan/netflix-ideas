import { chromium } from "playwright";
const browser = await chromium.launch();
const viewports = [
  { name: "narrow-900", width: 900, height: 800 },
  { name: "narrow-1100", width: 1100, height: 800 },
];
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/channels", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `reviews/snaps/channels-${vp.name}.png`, fullPage: false });
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("*")].find((n) => n.textContent === "Top 10 TV Shows in the U.S. Today");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `reviews/snaps/channels-${vp.name}-topten.png`, fullPage: false });
  console.log(`✓ ${vp.name}`);
  await ctx.close();
}
await browser.close();
