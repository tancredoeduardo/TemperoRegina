import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertFile(file) {
  assert(fs.existsSync(path.join(root, file)), `Arquivo obrigatorio ausente: ${file}`);
}

function checkSyntax(file) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Erro de sintaxe em ${file}\n${result.stderr || result.stdout}`);
  }
}

function collectHtmlAssets(html) {
  const assets = new Set();
  const attrRegex = /\b(?:src|href)=["']([^"']+)["']/g;
  let match;
  while ((match = attrRegex.exec(html))) {
    const value = match[1];
    if (!value.startsWith("/") || value.startsWith("//")) continue;
    if (value.startsWith("/api/") || value.startsWith("/#")) continue;
    const cleanPath = value.split("?")[0].split("#")[0].replace(/^\/+/, "");
    if (!cleanPath || !path.extname(cleanPath)) continue;
    assets.add(cleanPath);
  }
  return assets;
}

function checkHtmlAssets() {
  const htmlFiles = fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".html"));

  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(path.join(root, htmlFile), "utf8");
    for (const asset of collectHtmlAssets(html)) {
      assert(fs.existsSync(path.join(root, asset)), `${htmlFile} referencia asset inexistente: /${asset}`);
    }
  }
}

function checkVercelConfig() {
  const vercel = readJson("vercel.json");
  assert(Array.isArray(vercel.rewrites), "vercel.json precisa de rewrites");
  const catchAllIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/(.*)");
  const apiIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/api/(.*)");
  assert(catchAllIndex >= 0, "vercel.json precisa manter fallback para index.html");
  assert(apiIndex >= 0 && apiIndex < catchAllIndex, "rewrite de /api precisa vir antes do fallback SPA");
}

function checkPackage() {
  const pkg = readJson("package.json");
  assert(pkg.scripts?.build, "package.json precisa de script build");
  assert(pkg.dependencies?.["@supabase/supabase-js"], "Dependencia @supabase/supabase-js ausente");
}

[
  "index.html",
  "server.js",
  "server/app.js",
  "server/config.js",
  "server/repository.js",
  "server/security.js",
  "server/supabaseRepository.js",
  "lib/supabaseClient.js",
  "vercel.json",
].forEach(assertFile);

[
  "server.js",
  "server/app.js",
  "server/config.js",
  "server/repository.js",
  "server/security.js",
  "server/transport.js",
  "server/validation.js",
  "server/supabaseRepository.js",
  "lib/supabaseClient.js",
  "enhancements.js",
  "api/contact.js",
  "api/newsletter.js",
  "api/revendedores.js",
  "api/analytics.js",
  "api/products.js",
  "api/sellers/states.js",
].forEach(checkSyntax);

checkPackage();
checkVercelConfig();
checkHtmlAssets();

console.log("Build check concluido: sintaxe, assets, Vercel e Supabase OK.");
