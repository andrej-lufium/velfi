import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';

const PAGES = ['home', 'settings', 'dashboard', 'about'];
const PORT = 5173;

mkdirSync('screenshots', { recursive: true });

const vite = spawn('pnpm', ['dev'], { stdio: 'pipe' });

await new Promise((resolve) => {
  vite.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) resolve();
  });
});

const browser = await chromium.launch();

for (const pageName of PAGES) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`http://localhost:${PORT}/${pageName}`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `screenshots/${pageName}.png` });
  console.log(`✓ ${pageName}`);
  await page.close();
}

await browser.close();
vite.kill();
process.exit(0);