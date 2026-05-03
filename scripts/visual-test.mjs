import fs from "node:fs/promises";
import path from "node:path";

const routes = ["/", "/catalogo", "/blog", "/receitas", "/contato", "/catalogo-impressao", "/revendedores"];
const outDir = path.resolve("visual-report");

async function run() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("Playwright não está instalado. Execute: npm i -D playwright");
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const profiles = [
    { name: "desktop", viewport: { width: 1440, height: 900 }, userAgent: "visual-desktop" },
    { name: "mobile", viewport: { width: 390, height: 844 }, userAgent: "visual-mobile" },
  ];

  const results = [];
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      userAgent: profile.userAgent,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    for (const route of routes) {
      const url = `http://127.0.0.1:4173${route}`;
      const id = route === "/" ? "home" : route.replaceAll("/", "_").replace(/^_/, "");
      const target = path.join(outDir, `${profile.name}-${id}.png`);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.screenshot({ path: target, fullPage: true });
        results.push({ profile: profile.name, route, status: "ok", file: target });
      } catch (error) {
        results.push({ profile: profile.name, route, status: "error", message: error.message });
      }
    }
    await context.close();
  }

  await browser.close();
  await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify(results, null, 2), "utf8");

  const failed = results.filter((r) => r.status !== "ok");
  if (failed.length) {
    console.error(`Falhas em ${failed.length} capturas. Veja visual-report/summary.json`);
    process.exit(2);
  }
  console.log(`Capturas concluídas: ${results.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
