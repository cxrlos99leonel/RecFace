import { expect, test } from "@playwright/test";
import { expectAccessible, expectNoHorizontalScroll, watchErrors , open } from "./helpers";

test.describe("Portaria", () => {
  test("alterna entre reconhecer e cadastrar", async ({ page }) => {
    const errors = watchErrors(page);
    await open(page, "/plataforma");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("tab", { name: /Fazer cadastro/ }).first().click();
    await expect(page).toHaveURL(/modo=cadastro/);
    await expect(page.getByLabel("Nome completo")).toBeVisible();
    await page.getByRole("tab", { name: /Reconhecer rosto/ }).first().click();
    await expect(page).not.toHaveURL(/modo=cadastro/);
    await expectNoHorizontalScroll(page);
    expect(errors).toEqual([]);
  });

  test("cadastro exige fotos e consentimento", async ({ page }) => {
    await open(page, "/plataforma?modo=cadastro");
    await page.getByLabel("Nome completo").fill("Maria Teste");
    await page.getByLabel("Documento (CPF ou RG)").fill("12345678");
    await page.getByRole("button", { name: "Concluir cadastro" }).click();
    await expect(page.getByText(/Capture as 5 fotos/)).toBeVisible();
  });

  test("acessibilidade", async ({ page }) => {
    await open(page, "/plataforma");
    await expectAccessible(page);
    await open(page, "/plataforma?modo=cadastro");
    await expectAccessible(page);
  });
});
