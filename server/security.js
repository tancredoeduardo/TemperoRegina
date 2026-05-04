const { RATE_LIMIT, ALLOWED_ORIGINS } = require("./config");
const { trimText } = require("./utils");

const apiRateStore = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function cleanupRateStore() {
  const cutoff = Date.now() - RATE_LIMIT.windowMs;
  for (const [key, value] of apiRateStore.entries()) {
    if (value.lastSeen < cutoff) apiRateStore.delete(key);
  }
}

function isRateLimited(ip) {
  cleanupRateStore();
  const now = Date.now();
  const bucket = apiRateStore.get(ip);
  if (!bucket) {
    apiRateStore.set(ip, { count: 1, firstSeen: now, lastSeen: now });
    return false;
  }

  if (now - bucket.firstSeen > RATE_LIMIT.windowMs) {
    bucket.count = 1;
    bucket.firstSeen = now;
    bucket.lastSeen = now;
    return false;
  }

  bucket.count += 1;
  bucket.lastSeen = now;
  return bucket.count > RATE_LIMIT.maxRequests;
}

function isAllowedOrigin(req) {
  const origin = trimText(req.headers.origin);
  const referer = trimText(req.headers.referer);
  if (!origin && !referer) return true;
  if (origin && (ALLOWED_ORIGINS.has(origin) || matchesRequestHost(req, origin))) return true;
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.has(refOrigin) || matchesRequestHost(req, refOrigin)) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function matchesRequestHost(req, origin) {
  try {
    const requestHost = trimText(req.headers.host).toLowerCase();
    if (!requestHost) return false;
    return new URL(origin).host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

function securityHeaders(contentType) {
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": csp,
    "Cache-Control": "no-store",
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, securityHeaders("application/json; charset=utf-8"));
  res.end(JSON.stringify(payload));
}

module.exports = {
  getClientIp,
  isRateLimited,
  isAllowedOrigin,
  securityHeaders,
  sendJson,
};
