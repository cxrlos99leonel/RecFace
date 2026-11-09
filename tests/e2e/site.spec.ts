import { expect, test } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll, watchErrors , open } from "./helpers";

test.describe("Página inicial", () => {
  test("carrega, leva à plataforma e não tem erros", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Olhe.");
    await expect(page.getByRole("link", { name: /Acessar plataforma|Plataforma/ }).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });

  test("todo conteúdo aparece ao rolar a página", async ({ page }) => {
    await open(page, "/");
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= height; y += 600) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1200);
    await expect(page.locator(".rf-pending")).toHaveCount(0);
  });

  test("com movimento reduzido nada fica escondido", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await open(page, "/");
    await expect(page.locator(".rf-pending")).toHaveCount(0);
    await context.close();
  });

  test("acessibilidade", async ({ page }) => {
    await open(page, "/");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expectAccessible(page);
  });

  test("é instalável (manifesto e service worker)", async ({ page, request }) => {
    await open(page, "/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    const manifest = await (await request.get(href!)).json();
    expect(manifest.start_url).toBe("/plataforma");
    expect((await request.get("/sw.js")).ok()).toBeTruthy();
    expect((await request.get("/icons/icon-512.png")).ok()).toBeTruthy();
  });
});
