import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

const staticDirectories = ["assets", "download"];
const rootStaticFiles = [
  "enhancements.js",
  "hero-banner-final.png",
  "hero-banner-mobile-final.png",
  "hero-banner-mobile.png",
  "hero-banner-updated.png",
  "logo-icon.png",
  "restored-design.png",
  "yellow-pass-home.png",
];

function copyDirectory(source, target) {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const sourcePath = path.join(source, entry);
    const targetPath = path.join(target, entry);
    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (stats.isFile()) {
      mkdirSync(path.dirname(targetPath), { recursive: true });
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function copyStaticAssets() {
  const root = process.cwd();
  const outDir = path.join(root, "dist");

  for (const directory of staticDirectories) {
    copyDirectory(path.join(root, directory), path.join(outDir, directory));
  }

  for (const file of rootStaticFiles) {
    const source = path.join(root, file);
    if (!existsSync(source)) continue;
    copyFileSync(source, path.join(outDir, file));
  }
}

function getEnvValue(env, names) {
  for (const name of names) {
    const value = env[name];
    if (value) return value;
  }
  return "";
}

function createHtmlEnvPlugin(env) {
  const replacements = {
    "%NEXT_PUBLIC_SUPABASE_URL%": getEnvValue(env, ["NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL"]),
    "%NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY%": getEnvValue(env, [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ]),
    "%NEXT_PUBLIC_ADMIN_ACCESS_KEY%": getEnvValue(env, ["NEXT_PUBLIC_ADMIN_ACCESS_KEY", "VITE_ADMIN_ACCESS_KEY"]),
  };

  return {
    name: "regina-html-env",
    transformIndexHtml(html) {
      return Object.entries(replacements).reduce(
        (content, [placeholder, value]) => content.replaceAll(placeholder, value),
        html
      );
    },
  };
}

function createStaticAssetsPlugin() {
  return {
    name: "regina-static-assets",
    closeBundle: copyStaticAssets,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    publicDir: false,
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: "index.html",
          catalogo: "catalogo-impressao.html",
          revendedores: "revendedores.html",
        },
      },
    },
    plugins: [createHtmlEnvPlugin(env), createStaticAssetsPlugin()],
  };
});
