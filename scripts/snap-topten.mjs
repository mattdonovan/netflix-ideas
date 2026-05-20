import { chromium } from "playwright";
const browser = await chromium.launch();
const viewports = [
  { name: "tv-1920", width: 1920, height: 1080 },
  { name: "laptop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/channels", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("*")].find((n) => n.textContent === "Top 10 TV Shows in the U.S. Today");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(600);
  const file = `reviews/snaps/channels-${vp.name}-topten.png`;
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ ${file}`);
  await ctx.close();
}
await browser.close();
