const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(filename) {
  const envPath = path.join(__dirname, filename);
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const { createServer } = require("./server/app");
const { port, siteOrigin } = require("./server/config");

createServer().listen(port, () => {
  const displayUrl = siteOrigin || `http://127.0.0.1:${port}`;
  console.log(`Tempero Regina clone: ${displayUrl}`);
});
