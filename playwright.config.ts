import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

/**
 * Testes de interface da RecFace.
 *   bun run build && bun run test:e2e
 * Sobe a versão compilada (sem Vercel e sem Redis: os dados ficam em memória).
 */
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `bunx srvx --port ${PORT} --static ${resolve("dist/client")} dist/server/index.mjs`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
