import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Falha se houver erro de JavaScript na página. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Nenhuma violação de acessibilidade séria ou crítica (WCAG 2.1 A/AA). */
export async function expectAccessible(page: Page) {
  // Texto puramente decorativo e oculto de leitores de tela (aria-hidden) é isento de contraste (WCAG 1.4.3).
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude('[aria-hidden="true"]')
    .analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}x) ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`)
  ).toEqual([]);
}

/** Nada pode vazar para os lados (rolagem horizontal). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Abre a página e espera o React assumir os controles. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}
