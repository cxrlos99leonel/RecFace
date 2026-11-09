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
    { headers: { "cache-control": "public, max-age=31536000, immutable" }, src: "/assets/(.*)" },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
};

writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("[fix-vercel-output] config.json patched, empty /api funcs removed.");
