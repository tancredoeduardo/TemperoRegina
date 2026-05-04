import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

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

export default defineConfig({
  publicDir: false,
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
  plugins: [
    {
      name: "regina-static-assets",
      closeBundle: copyStaticAssets,
    },
  ],
});
