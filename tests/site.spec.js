const { test, expect } = require("@playwright/test");

test("abre a surpresa e revela uma memória ao raspar", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#unlockButton")).toBeVisible();
  await page.locator("#unlockButton").click();
  await expect(page.locator("body")).toHaveClass(/unlocked/, { timeout: 3_000 });
  await expect(page.locator("#sobre h1")).toBeVisible();

  const firstCard = page.locator(".memory-card").first();
  await firstCard.scrollIntoViewIfNeeded();
  const canvas = firstCard.locator(".scratch-canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const columns = 7;
  const rows = 8;
  for (let row = 0; row < rows; row += 1) {
    const y = box.y + ((row + 0.5) / rows) * box.height;
    const startX = box.x + (row % 2 === 0 ? 0 : box.width);
    const endX = box.x + (row % 2 === 0 ? box.width : 0);
    await page.mouse.move(startX, y);
    for (let column = 1; column <= columns; column += 1) {
      await page.mouse.move(startX + ((endX - startX) * column) / columns, y);
    }
  }

  await expect(firstCard).toHaveClass(/is-revealed/);
});