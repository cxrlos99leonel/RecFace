import { expect, test } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll , open } from "./helpers";

// Credenciais de desenvolvimento (sem ADMIN_EMAIL/ADMIN_PASSWORD definidos).
const EMAIL = "admin@recface.local";
const PASSWORD = "recface123";

test.describe("Administrador", () => {
  test("painel exige login", async ({ page }) => {
    await open(page, "/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("senha errada mostra aviso", async ({ page }) => {
    await open(page, "/login");
    await page.getByLabel("Usuário ou e-mail").fill(EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill("errada");
    await page.getByRole("button", { name: /^Entrar/ }).click();
    await expect(page.getByText(/incorretos/)).toBeVisible();
  });

  test("entra, navega pelo painel e sai", async ({ page }) => {
    await open(page, "/login");
    await expectAccessible(page);
    await page.getByLabel("Usuário ou e-mail").fill(EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: /^Entrar/ }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);

    for (const path of ["/admin/participantes", "/admin/relatorios"]) {
      await open(page, path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalScroll(page);
      await expectAccessible(page);
    }
  });
});
