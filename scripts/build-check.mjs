import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const publicDir = path.join(root, "public");
const rootStaticExtensions = new Set([".html", ".css", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"]);
const rootStaticJsPatterns = [/^index-[\w-]+\.js$/, /^config-[\w-]+\.js$/, /^enhancements\.js$/];
const staticDirectories = ["assets", "download"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertFile(file) {
  assert(fs.existsSync(path.join(root, file)), `Arquivo obrigatorio ausente: ${file}`);
}

function copyFileToPublic(file) {
  const source = path.join(root, file);
  const target = path.join(publicDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectoryToPublic(directory) {
  const sourceDir = path.join(root, directory);
  if (!fs.existsSync(sourceDir)) return;

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const relativePath = path.join(directory, entry.name);
    const sourcePath = path.join(root, relativePath);
    const targetPath = path.join(publicDir, relativePath);
    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyDirectoryToPublic(relativePath);
      continue;
    }

    if (stats.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function shouldCopyRootStaticFile(file) {
  const extension = path.extname(file);
  if (rootStaticExtensions.has(extension)) return true;
  return rootStaticJsPatterns.some((pattern) => pattern.test(file));
}

function buildStaticOutput() {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.mkdirSync(publicDir, { recursive: true });

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (shouldCopyRootStaticFile(entry.name)) {
      copyFileToPublic(entry.name);
    }
  }

  for (const directory of staticDirectories) {
    copyDirectoryToPublic(directory);
  }
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
  assert(vercel.outputDirectory === "public", "vercel.json precisa publicar a pasta public");
  assert(vercel.buildCommand === "npm run build", "vercel.json precisa usar npm run build");
  assert(!vercel.functions, "vercel.json nao deve declarar functions para deploy estatico");
  assert(Array.isArray(vercel.rewrites), "vercel.json precisa de rewrites");
  const catchAllIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/(.*)");
  const apiIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/api/(.*)");
  assert(catchAllIndex >= 0, "vercel.json precisa manter fallback para index.html");
  assert(apiIndex === -1, "vercel.json nao deve rotear /api no deploy estatico");
}

function checkNoServerlessEntrypoints() {
  [
    "index.js",
    "server.js",
    path.join("api", "index.js"),
  ].forEach((file) => {
    assert(!fs.existsSync(path.join(root, file)), `Entrypoint serverless proibido no deploy estatico: ${file}`);
  });
  assert(!fs.existsSync(path.join(root, "api")), "Pasta api/ nao deve existir na raiz; use local-api/ apenas para desenvolvimento local");
}

function checkPackage() {
  const pkg = readJson("package.json");
  assert(pkg.scripts?.build, "package.json precisa de script build");
  assert(pkg.dependencies?.["@supabase/supabase-js"], "Dependencia @supabase/supabase-js ausente");
}

[
  "index.html",
  "lib/supabaseClient.js",
  "vercel.json",
].forEach(assertFile);

[
  "lib/supabaseClient.js",
  "enhancements.js",
].forEach(checkSyntax);

checkNoServerlessEntrypoints();
checkPackage();
checkVercelConfig();
checkHtmlAssets();
buildStaticOutput();
assertFile("public/index.html");
assertFile("public/download/catalogo-regina.pdf");

console.log("Build check concluido: deploy estatico, assets, Vercel e Supabase OK.");
