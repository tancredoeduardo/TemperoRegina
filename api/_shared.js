const { BODY_LIMIT_BYTES } = require("../server/config");
const { loadProducts, loadSellers, saveSubmission, forwardIntegrationsAsync } = require("../server/repository");
const { sanitizePayload } = require("../server/validation");
const { sendJson, getClientIp, isRateLimited, isAllowedOrigin } = require("../server/security");

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw, "utf8") > BODY_LIMIT_BYTES) {
        reject(new Error("Payload muito grande"));
        req.destroy();
      }
    });

    req.on("end", () => {
      const type = String(req.headers["content-type"] || "").toLowerCase();
      try {
        if (type.includes("application/json")) {
          resolve(raw ? JSON.parse(raw) : {});
          return;
        }

        if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams(raw);
          resolve(Object.fromEntries(params.entries()));
          return;
        }

        resolve({});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function ensureMethod(req, res, method) {
  if (req.method === method) return true;
  sendJson(res, 405, { ok: false, error: "Metodo nao permitido" });
  return false;
}

function createPostHandler(kind) {
  return async function postHandler(req, res) {
    if (!ensureMethod(req, res, "POST")) return;

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      sendJson(res, 429, { ok: false, error: "Muitas requisicoes. Tente novamente em instantes." });
      return;
    }

    if (!isAllowedOrigin(req)) {
      sendJson(res, 403, { ok: false, error: "Origem nao autorizada" });
      return;
    }

    try {
      const payload = await parseBody(req);
      const sanitized = sanitizePayload(kind, payload);
      const record = await saveSubmission(kind, sanitized, req);
      forwardIntegrationsAsync(kind, record);
      sendJson(res, 200, { ok: true, message: "Recebido com sucesso" });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message || "Erro ao processar" });
    }
  };
}

function productsHandler(req, res) {
  if (!ensureMethod(req, res, "GET")) return;
  sendJson(res, 200, { ok: true, categories: loadProducts() });
}

function sellersHandler(req, res) {
  if (!ensureMethod(req, res, "GET")) return;
  sendJson(res, 200, { ok: true, states: loadSellers() });
}

module.exports = {
  createPostHandler,
  productsHandler,
  sellersHandler,
};
