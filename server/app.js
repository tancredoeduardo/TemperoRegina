const http = require("node:http");
const path = require("node:path");
const { API_ROUTES, ROUTE_FILES } = require("./config");
const { root, loadProducts, loadSellers, saveSubmission, forwardIntegrationsAsync } = require("./repository");
const { sanitizePayload } = require("./validation");
const { parseBody, resolveStaticPath, streamFile } = require("./transport");
const { sendJson, getClientIp, isRateLimited, isAllowedOrigin } = require("./security");

async function handleApiPost(req, res, pathname) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    sendJson(res, 429, { ok: false, error: "Muitas requisicoes. Tente novamente em instantes." });
    return;
  }

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: "Origem nao autorizada" });
    return;
  }

  const kind = API_ROUTES[pathname];
  if (!kind) {
    sendJson(res, 404, { ok: false, error: "Endpoint nao encontrado" });
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
}

function handleApiGet(res, pathname) {
  if (pathname === "/api/products") {
    sendJson(res, 200, { ok: true, categories: loadProducts() });
    return true;
  }
  if (pathname === "/api/sellers/states") {
    sendJson(res, 200, { ok: true, states: loadSellers() });
    return true;
  }
  return false;
}

async function handleRequest(req, res) {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url, `http://${host}`);
    const pathname = url.pathname;

    if (req.method === "POST" && pathname.startsWith("/api/")) {
      await handleApiPost(req, res, pathname);
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/")) {
      if (!handleApiGet(res, pathname)) {
        sendJson(res, 404, { ok: false, error: "Endpoint nao encontrado" });
      }
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { ok: false, error: "Metodo nao permitido" });
      return;
    }

    if (ROUTE_FILES[pathname]) {
      const routePath = path.join(root, ROUTE_FILES[pathname]);
      streamFile(res, routePath, req.method);
      return;
    }

    const filePath = resolveStaticPath(pathname);
    if (!filePath) {
      sendJson(res, 403, { ok: false, error: "Forbidden" });
      return;
    }
    streamFile(res, filePath, req.method);
}

function createServer() {
  return http.createServer(handleRequest);
}

module.exports = {
  createServer,
  handleRequest,
};
