import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:5173/channels", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const headerBoxes = await page.evaluate(() => {
  const ariaLabels = ["Search", "Notifications"];
  const results = ariaLabels.map(label => {
    const el = document.querySelector(`[aria-label="${label}"]`);
    if (!el) return { label, found: false };
    const r = el.getBoundingClientRect();
    return { label, found: true, x: r.x, y: r.y, w: r.width, h: r.height, visible: r.x >= 0 && r.x + r.width <= 900 };
  });
  // Also find the avatar emoji
  const avatar = document.querySelector('[aria-label="avatar"]');
  if (avatar) {
    const r = avatar.getBoundingClientRect();
    results.push({ label: "avatar", found: true, x: r.x, y: r.y, w: r.width, h: r.height, visible: r.x >= 0 && r.x + r.width <= 900 });
  } else {
    results.push({ label: "avatar", found: false });
  }
  return results;
});
console.log(JSON.stringify(headerBoxes, null, 2));
await browser.close();
