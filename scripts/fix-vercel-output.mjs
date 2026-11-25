import { writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";

const outputDir = join(process.cwd(), ".vercel", "output");
const configPath = join(outputDir, "config.json");
const apiDir = join(outputDir, "functions", "api");

if (!existsSync(configPath)) {
  console.log("[fix-vercel-output] .vercel/output não encontrado — nada a ajustar.");
  process.exit(0);
}

// Remove empty individual API function directories (Nitro generates them empty)
if (existsSync(apiDir)) {
  rmSync(apiDir, { recursive: true, force: true });
}

// Rewrite config.json to route everything through __server
const config = {
  version: 3,
  framework: { name: "nitro", version: "3.0.260429-beta" },
  overrides: {},
  routes: [
    // Cabeçalhos de segurança também nos arquivos estáticos (o servidor aplica os
    // mesmos em páginas e API via server/middleware/security-headers.ts).
    {
      src: "/(.*)",
      headers: {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      },
      continue: true,
    },
    { headers: { "cache-control": "public, max-age=31536000, immutable" }, src: "/assets/(.*)" },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
};

writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("[fix-vercel-output] config.json patched, empty /api funcs removed.");
