const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const {
  root,
  dataDir,
  productsSourcePath,
  sellersSourcePath,
  crmWebhookUrl,
  analyticsWebhookUrl,
  WEBHOOK_TIMEOUT_MS,
} = require("./config");
const { nowIso, trimText } = require("./utils");
const { getClientIp } = require("./security");
const { saveSubmissionToSupabase } = require("./supabaseRepository");

let cachedProducts = null;
let cachedSellers = null;

function decodeBroken(str) {
  if (!str) return str;
  return str
    .replaceAll("ÃƒÆ’Ã‚Â§", "Ã§")
    .replaceAll("ÃƒÆ’Ã‚Â£", "Ã£")
    .replaceAll("ÃƒÆ’Ã‚Â¡", "Ã¡")
    .replaceAll("ÃƒÆ’Ã‚Â¢", "Ã¢")
    .replaceAll("ÃƒÆ’Ã‚Âª", "Ãª")
    .replaceAll("ÃƒÆ’Ã‚Â©", "Ã©")
    .replaceAll("ÃƒÆ’Ã‚Â­", "Ã­")
    .replaceAll("ÃƒÆ’Ã‚Â³", "Ã³")
    .replaceAll("ÃƒÆ’Ã‚Â´", "Ã´")
    .replaceAll("ÃƒÆ’Ã‚Âº", "Ãº")
    .replaceAll("ÃƒÆ’Ã‚Â", "Ã")
    .replaceAll("ÃƒÆ’Ã¢â‚¬Â°", "Ã‰")
    .replaceAll("ÃƒÆ’Ã‚Â", "Ã")
    .replaceAll("ÃƒÆ’Ã¢â‚¬Å“", "Ã“")
    .replaceAll("ÃƒÆ’Ã…Â¡", "Ãš");
}

function loadProducts() {
  if (cachedProducts) return cachedProducts;
  let content = "";
  try {
    content = fs.readFileSync(productsSourcePath, "utf8");
  } catch {
    cachedProducts = [];
    return cachedProducts;
  }

  const categoryBlocks = content.match(/\{\s*id:\s*"[^"]+",\s*title:\s*"[^"]+",\s*products:\s*\[[\s\S]*?\]\s*\}/g) || [];
  const categories = categoryBlocks.map((block) => {
    const id = (block.match(/id:\s*"([^"]+)"/) || [])[1] || "";
    const title = decodeBroken((block.match(/title:\s*"([^"]+)"/) || [])[1] || "");
    const products = [];
    const productRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*image:\s*"([^"]+)",\s*downloadUrl:\s*"([^"]+)"/g;
    let match;
    while ((match = productRegex.exec(block))) {
      products.push({
        id: match[1],
        name: decodeBroken(match[2]),
        image: match[3],
        downloadUrl: match[4],
      });
    }
    return { id, title, products };
  });
  cachedProducts = categories.filter((c) => c.id && c.products.length > 0);
  return cachedProducts;
}

function loadSellers() {
  if (cachedSellers) return cachedSellers;
  let content = "";
  try {
    content = fs.readFileSync(sellersSourcePath, "utf8");
  } catch {
    cachedSellers = [];
    return cachedSellers;
  }
  const stateBlocks = content.match(/\{\s*sigla:\s*"[^"]+"[\s\S]*?\}\s*,?/g) || [];
  const states = stateBlocks.map((block) => {
    const sigla = (block.match(/sigla:\s*"([^"]+)"/) || [])[1] || "";
    const nome = decodeBroken((block.match(/nome:\s*"([^"]+)"/) || [])[1] || "");
    const regiao = decodeBroken((block.match(/regiao:\s*"([^"]+)"/) || [])[1] || "");
    return { sigla, nome, regiao };
  });
  cachedSellers = states.filter((s) => s.sigla && s.nome);
  return cachedSellers;
}

async function saveSubmission(kind, payload, req) {
  const record = {
    id: crypto.randomUUID(),
    kind,
    createdAt: nowIso(),
    ip: getClientIp(req),
    userAgent: trimText(req.headers["user-agent"]).slice(0, 300),
    payload,
  };

  try {
    const supabaseResult = await saveSubmissionToSupabase(record);
    if (supabaseResult.ok) {
      return { ...record, storage: "supabase" };
    }
  } catch (error) {
    console.warn("Falha ao salvar no Supabase:", error.message);
    if (process.env.REQUIRE_SUPABASE_STORAGE === "1") {
      throw new Error("Nao foi possivel salvar o envio no Supabase");
    }
  }

  if (process.env.VERCEL) {
    return { ...record, storage: "serverless-memory" };
  }

  await fs.promises.mkdir(dataDir, { recursive: true });
  await fs.promises.appendFile(path.join(dataDir, `${kind}.jsonl`), `${JSON.stringify(record)}\n`, "utf8");
  return { ...record, storage: "local-file" };
}

async function postWebhook(url, body) {
  if (!url) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`Webhook ${url} respondeu ${response.status}`);
    }
  } catch (error) {
    console.warn(`Falha ao enviar webhook ${url}:`, error.message);
  } finally {
    clearTimeout(timeout);
  }
}

function forwardIntegrationsAsync(kind, record) {
  const forwardPromise =
    kind === "analytics" ? postWebhook(analyticsWebhookUrl, record) : postWebhook(crmWebhookUrl, record);
  forwardPromise.catch((error) => {
    console.warn("Falha inesperada em integracao:", error.message);
  });
}

module.exports = {
  root,
  loadProducts,
  loadSellers,
  saveSubmission,
  forwardIntegrationsAsync,
};
