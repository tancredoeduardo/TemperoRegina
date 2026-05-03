const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

function getSupabaseConfig(env = process.env) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

function hasSupabaseConfig(config = getSupabaseConfig()) {
  return Boolean(config.url && config.anonKey);
}

function assertSupabaseConfig(config = getSupabaseConfig()) {
  const missing = [];
  if (!config.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!config.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length) {
    throw new Error(`Configuracao do Supabase incompleta: ${missing.join(", ")}`);
  }
  return config;
}

function createSupabaseClient(config = getSupabaseConfig()) {
  const safeConfig = assertSupabaseConfig(config);
  return createClient(safeConfig.url, safeConfig.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function getSupabaseClient() {
  if (!hasSupabaseConfig()) return null;
  if (!cachedClient) cachedClient = createSupabaseClient();
  return cachedClient;
}

module.exports = {
  getSupabaseConfig,
  hasSupabaseConfig,
  assertSupabaseConfig,
  createSupabaseClient,
  getSupabaseClient,
};
