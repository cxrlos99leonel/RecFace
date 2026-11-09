import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Na Vercel, o build precisa sair no formato Build Output API (.vercel/output).
// Localmente continua em dist/ (usado pelos testes e pelo preview).
const onVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
    scanDirs: ["server"],
    ...(onVercel && {
      output: {
        dir: ".vercel/output",
        serverDir: ".vercel/output/functions/__server.func",
        publicDir: ".vercel/output/static",
      },
    }),
  },
});
