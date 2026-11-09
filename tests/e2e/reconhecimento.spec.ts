import { chromium, expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { open } from "./helpers";
import { resolve } from "node:path";

/**
 * Fluxo completo com uma câmera simulada (vídeo .y4m com um rosto).
 * Gere os vídeos com:  ffmpeg -loop 1 -i rosto.jpg -vf "scale=-2:720,pad=1280:720:(ow-iw)/2:0,format=yuv420p" -t 2 -r 10 tests/fixtures/rosto-a.y4m
 * Sem os arquivos, o teste é pulado.
 */
const A = resolve("tests/fixtures/rosto-a.y4m");
const B = resolve("tests/fixtures/rosto-b.y4m");

async function withCamera(video: string, baseURL: string, fn: (page: import("@playwright/test").Page) => Promise<void>) {
  const browser = await chromium.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--use-file-for-fake-video-capture=${video}`],
  });
  const context = await browser.newContext({ baseURL, permissions: ["camera"], viewport: { width: 1440, height: 900 } });
  try {
    await fn(await context.newPage());
  } finally {
    await browser.close();
  }
}

test.describe("Reconhecimento facial (câmera simulada)", () => {
  test.skip(!existsSync(A) || !existsSync(B), "vídeos de teste ausentes em tests/fixtures");
  test.describe.configure({ mode: "serial", timeout: 240_000 });

  test("cadastra, libera a entrada e nega um rosto desconhecido", async ({ baseURL }, info) => {
    test.skip(info.project.name !== "desktop", "roda só uma vez, no projeto desktop");
    const doc = `DOC${Date.now()}`;
    await withCamera(A, baseURL!, async (page) => {
      await open(page, "/plataforma?modo=cadastro");
      for (let i = 1; i <= 5; i++) {
        const btn = page.getByRole("button", { name: `Capturar foto ${i}` });
        await expect(btn).toBeEnabled({ timeout: 120_000 });
        await btn.click();
        await expect(page.locator('[aria-label^="Refazer foto"]')).toHaveCount(i, { timeout: 60_000 });
      }
      await page.getByLabel("Nome completo").fill("Pessoa Teste");
      await page.getByLabel("Documento (CPF ou RG)").fill(doc);
      await page.locator("input[type=checkbox]").check();
      await page.getByRole("button", { name: "Concluir cadastro" }).click();
      await expect(page.getByText(/Cadastro de Pessoa concluído/)).toBeVisible();
    });

    await withCamera(A, baseURL!, async (page) => {
      await open(page, "/plataforma");
      await expect(page.getByRole("status").first()).toContainText(/Acesso liberado|Já entrou hoje/i, { timeout: 120_000 });
    });

    await withCamera(B, baseURL!, async (page) => {
      await open(page, "/plataforma");
      await expect(page.getByRole("status").first()).toContainText(/Acesso negado/i, { timeout: 120_000 });
    });
  });
});
