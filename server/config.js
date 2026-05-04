const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const dataDir = path.join(root, "data");
const productsSourcePath = path.join(root, "srcmap_mocks__products.ts.txt");
const sellersSourcePath = path.join(root, "srcmap_mocks__vendedores.ts.txt");

const crmWebhookUrl = process.env.CRM_WEBHOOK_URL || "";
const analyticsWebhookUrl = process.env.ANALYTICS_WEBHOOK_URL || "";
const siteOrigin = process.env.SITE_ORIGIN || "";
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const BODY_LIMIT_BYTES = 256 * 1024;
const WEBHOOK_TIMEOUT_MS = 3500;

const RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 80,
};

const ALLOWED_STATIC_ROOTS = [
  root,
  path.join(root, "assets"),
  path.join(root, "download"),
];

const DENIED_PATH_PATTERNS = [
  /^data\//i,
  /^node_modules\//i,
  /^scripts\//i,
  /^chrome-profile/i,
  /^server\.(js|log|err\.log)$/i,
  /^package(-lock)?\.json$/i,
  /^\.env/i,
  /\.jsonl$/i,
  /\.log$/i,
];

const ALLOWED_ORIGINS = new Set([
  `http://localhost:${port}`,
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  siteOrigin,
  ...configuredOrigins,
].filter(Boolean));

const ROUTE_FILES = {
  "/admin": "index.html",
  "/catalogo-impressao": "catalogo-impressao.html",
  "/revendedores": "revendedores.html",
};

const API_ROUTES = {
  "/api/contact": "contact",
  "/api/newsletter": "newsletter",
  "/api/revendedores": "revendedores",
  "/api/analytics": "analytics",
};

module.exports = {
  root,
  port,
  dataDir,
  productsSourcePath,
  sellersSourcePath,
  crmWebhookUrl,
  analyticsWebhookUrl,
  siteOrigin,
  MIME_TYPES,
  BODY_LIMIT_BYTES,
  WEBHOOK_TIMEOUT_MS,
  RATE_LIMIT,
  ALLOWED_STATIC_ROOTS,
  DENIED_PATH_PATTERNS,
  ALLOWED_ORIGINS,
  ROUTE_FILES,
  API_ROUTES,
};
