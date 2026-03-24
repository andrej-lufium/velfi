import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PAGE = process.argv[2] || '?sample';
const OUTPUT = `screenshots/${PAGE}.png`;
const PORT = 5173;

// Start the Vite dev server
const vite = spawn('pnpm', ['dev'], { stdio: 'pipe' });

// Wait for Vite to be ready
await new Promise((resolve) => {
  vite.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) resolve();
  });
});

const browser = await chromium.launch();
const page = await browser.newPage();

// Set desktop viewport
await page.setViewportSize({ width: 1280, height: 800 });

// Navigate to the specific page
await page.goto(`http://localhost:${PORT}/${PAGE}`);
await page.waitForLoadState('networkidle');

// Optional: wait for a specific element to be visible
// await page.waitForSelector('.main-content');

await page.screenshot({ path: OUTPUT, fullPage: true });
console.log(`✓ Screenshot saved: ${OUTPUT}`);

await browser.close();
vite.kill();
process.exit(0);

/*

{
  "scripts": {
    "screenshot": "node scripts/screenshot.mjs",
    "screenshot:all": "node scripts/screenshot-all.mjs"
  }
}

pnpm screenshot home
pnpm screenshot settings
pnpm screenshot dashboard screenshots/my-output.png

*/
