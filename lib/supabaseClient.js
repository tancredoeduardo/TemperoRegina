const { createClient } = require("@supabase/supabase-js");

let cachedClient = null;

function getSupabaseKey(env = process.env) {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
}

function getSupabaseConfig(env = process.env) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || "",
    publishableKey: getSupabaseKey(env),
  };
}

function hasSupabaseConfig(config = getSupabaseConfig()) {
  return Boolean(config.url && config.publishableKey);
}

function assertSupabaseConfig(config = getSupabaseConfig()) {
  const missing = [];
  if (!config.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!config.publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (missing.length) {
    throw new Error(`Configuracao do Supabase incompleta: ${missing.join(", ")}`);
  }
  return config;
}

function createSupabaseClient(config = getSupabaseConfig()) {
  const safeConfig = assertSupabaseConfig(config);
  return createClient(safeConfig.url, safeConfig.publishableKey, {
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
  getSupabaseKey,
  getSupabaseConfig,
  hasSupabaseConfig,
  assertSupabaseConfig,
  createSupabaseClient,
  getSupabaseClient,
};
