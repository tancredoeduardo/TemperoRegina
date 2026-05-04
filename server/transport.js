const fs = require("node:fs");
const path = require("node:path");
const { BODY_LIMIT_BYTES, MIME_TYPES, root, ALLOWED_STATIC_ROOTS, DENIED_PATH_PATTERNS } = require("./config");
const { securityHeaders } = require("./security");

const HTML_ENV_PLACEHOLDERS = {
  "%NEXT_PUBLIC_SUPABASE_URL%": ["NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"],
  "%NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY%": [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ],
  "%NEXT_PUBLIC_ADMIN_ACCESS_KEY%": ["NEXT_PUBLIC_ADMIN_ACCESS_KEY", "VITE_ADMIN_ACCESS_KEY"],
};

function getRuntimeEnvValue(names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return "";
}

function applyRuntimeHtmlEnv(html) {
  return Object.entries(HTML_ENV_PLACEHOLDERS).reduce(
    (content, [placeholder, names]) => content.replaceAll(placeholder, getRuntimeEnvValue(names)),
    html,
  );
}

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

function safeDecodePath(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function isDeniedPath(relativePath) {
  const unixPath = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  return DENIED_PATH_PATTERNS.some((pattern) => pattern.test(unixPath));
}

function isAllowedStaticFile(resolvedPath) {
  const normalized = path.resolve(resolvedPath);
  const insideAllowedRoot = ALLOWED_STATIC_ROOTS.some((allowedRoot) => {
    const rootResolved = path.resolve(allowedRoot);
    return normalized === rootResolved || normalized.startsWith(`${rootResolved}${path.sep}`);
  });
  if (!insideAllowedRoot) return false;

  const rel = path.relative(root, normalized);
  if (!rel || rel.startsWith("..")) return false;
  if (isDeniedPath(rel)) return false;
  return true;
}

function resolveStaticPath(urlPathname) {
  const decoded = safeDecodePath(urlPathname);
  if (!decoded) return null;
  const cleanPath = decoded.replace(/^\/+/, "");
  const requested = path.resolve(path.join(root, cleanPath || "index.html"));
  if (!isAllowedStaticFile(requested)) return null;

  if (!fs.existsSync(requested) || fs.statSync(requested).isDirectory()) {
    return path.join(root, "index.html");
  }
  return requested;
}

function streamFile(res, filePath, method = "GET") {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, securityHeaders(contentType));
  if (method === "HEAD") {
    res.end();
    return;
  }

  if (ext === ".html") {
    res.end(applyRuntimeHtmlEnv(fs.readFileSync(filePath, "utf8")));
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

module.exports = {
  parseBody,
  resolveStaticPath,
  streamFile,
};
