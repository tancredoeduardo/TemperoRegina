import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  getSupabaseConfig,
  hasSupabaseConfig,
  createSupabaseClient,
} = require("../lib/supabaseClient");
const { getSubmissionsTable } = require("../server/supabaseRepository");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function loadEnvFile(filename) {
  const filepath = path.join(rootDir, filename);
  if (!fs.existsSync(filepath)) return;

  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key]) continue;

    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const config = getSupabaseConfig();

if (!hasSupabaseConfig(config)) {
  console.log(
    "Supabase: variaveis ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY na Vercel."
  );
  process.exit(0);
}

try {
  const url = new URL(config.url);
  if (!url.hostname.includes("supabase.co")) {
    console.warn("Supabase: URL nao parece ser do dominio supabase.co. Verifique antes do deploy.");
  }
  const supabase = createSupabaseClient(config);

  if (process.env.SUPABASE_HEALTHCHECK_INSERT === "1") {
    const { error } = await supabase.from(getSubmissionsTable()).insert({
      kind: "analytics",
      payload: {
        event: "supabase-healthcheck",
        source: "scripts/check-supabase.mjs",
      },
    });

    if (error) throw error;
    console.log(`Supabase: insert de teste realizado em ${getSubmissionsTable()}.`);
  }

  console.log("Supabase: client inicializado com sucesso.");
} catch (error) {
  console.error(`Supabase: falha na configuracao - ${error.message}`);
  process.exit(1);
}
