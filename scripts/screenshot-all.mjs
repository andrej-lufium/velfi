import { chromium } from "playwright"
//import { spawn } from "child_process"
//import { mkdirSync } from "fs"

const PAGES = [
  "?sample",
  "issuer?sample&index=1",
  "asset?sample&assetIndex=0&issuerIndex=0",
  "asset/report?sample&issuerIndex=0&assetIndex=0",
  "report?sample",
]
const PORT = 5173

/*
mkdirSync('screenshots', { recursive: true });

const vite = spawn('pnpm', ['dev'], { stdio: 'pipe' });

await new Promise((resolve) => {
  vite.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) resolve();
  });
});
*/

// we expect wails dev to be running already, which starts the Vite server as well, so we skip starting it here
const browser = await chromium.launch()

for (const pageName of PAGES) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(`http://localhost:${PORT}/${pageName}`)
  await page.waitForLoadState("networkidle")
  const sanitizedName = pageName.replace(/[^a-zA-Z0-9]/g, '')
  await page.screenshot({ path: `docs/${sanitizedName}.png` })
  console.log(`✓ ${pageName}`)
  await page.close()
}

await browser.close()
//vite.kill()
//process.exit(0)
