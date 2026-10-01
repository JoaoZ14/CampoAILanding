const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/Aluno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = __dirname;
const out = path.join(root, 'slides');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 460, height: 590 },
    deviceScaleFactor: 1080 / 420,
  });
  await page.goto(pathToFileURL(path.join(root, 'preview.html')).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  for (let i = 1; i <= 5; i++) {
    await page.locator(`.slide:nth-child(${i})`).screenshot({
      path: path.join(out, `slide-${String(i).padStart(2, '0')}.png`),
      animations: 'disabled',
    });
    console.log(`Exported ${i}/5`);
  }
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
