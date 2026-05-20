import { chromium } from "playwright";
const browser = await chromium.launch();

async function shot(name, vp, action) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/channels", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  if (action) await action(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `reviews/snaps/${name}.png`, fullPage: false });
  console.log(`✓ ${name}`);
  await ctx.close();
}

const tv = { width: 1920, height: 1080 };

// Initial state — nothing hovered, mouse mode
await shot("interact-initial", tv);

// Hover a tile in row 2 (skipping the first row)
await shot("interact-hover", tv, async (page) => {
  await page.evaluate(() => {
    const titleEl = [...document.querySelectorAll("*")].find((n) => n.textContent === "New on Netflix");
    if (titleEl) titleEl.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(400);
  // hover the 2nd tile of New on Netflix
  await page.mouse.move(500, 250);
});

// Keyboard nav — press arrow right to advance
await shot("interact-keyboard-right", tv, async (page) => {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowRight");
});

// Click off — should clear focus
await shot("interact-clickoff", tv, async (page) => {
  // First press a key to focus something with keyboard
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  // Then click on the page background
  await page.mouse.click(1900, 50);
});

// Escape — should clear focus
await shot("interact-escape", tv, async (page) => {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  await page.keyboard.press("Escape");
});

// Chevron click on Your Next Watch row
await shot("interact-chevron", tv, async (page) => {
  const title = await page.locator('text="Your Next Watch"').first();
  await title.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  // hover row to reveal chevron, then click right chevron
  const row = await page.locator('[aria-label="Scroll right"]').first();
  await row.click();
});

await browser.close();
