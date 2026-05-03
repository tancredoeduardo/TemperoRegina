import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getSupabaseConfig,
  hasSupabaseConfig,
  createSupabaseClient,
} = require("../lib/supabaseClient");

const config = getSupabaseConfig();

if (!hasSupabaseConfig(config)) {
  console.log("Supabase: variaveis ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.");
  process.exit(0);
}

try {
  const url = new URL(config.url);
  if (!url.hostname.includes("supabase.co")) {
    console.warn("Supabase: URL nao parece ser do dominio supabase.co. Verifique antes do deploy.");
  }
  createSupabaseClient(config);
  console.log("Supabase: client inicializado com sucesso.");
} catch (error) {
  console.error(`Supabase: falha na configuracao - ${error.message}`);
  process.exit(1);
}
