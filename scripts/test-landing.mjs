import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPreviewServer } from './preview.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const artifacts = resolve(dirname(fileURLToPath(import.meta.url)), '../test-artifacts');
await mkdir(artifacts, { recursive: true });
const server = createPreviewServer();
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
const catalog = {
  ok: true, currency: 'BRL', plans: [
    { code: 'lite', name: 'Essencial', priceBrl: 29, period: 'mês', customerSegment: 'personal', seats: 1, highlight: false, bullets: ['Até 35 análises com IA por mês'] },
    { code: 'basic', name: 'Starter', priceBrl: 49, period: 'mês', customerSegment: 'personal', seats: 1, highlight: true, bullets: ['Um número de WhatsApp com análises ilimitadas (uso justo)'] },
    { code: 'premium', name: 'Team', priceBrl: 119, period: 'mês', customerSegment: 'personal', seats: 3, highlight: false, bullets: ['Até 3 números de WhatsApp no mesmo plano'] },
    { code: 'premium', name: 'Business', priceBrl: 199, period: 'mês', customerSegment: 'company', seats: 5, highlight: true, bullets: ['Até 5 números de WhatsApp no mesmo plano'] }
  ]
};
const news = { fetchedAt: new Date().toISOString(), items: Array.from({ length: 6 }, (_, index) => ({ title: 'Notícia de teste ' + (index + 1), url: 'https://www.embrapa.br/', source: 'Embrapa', publishedAt: '2026-10-01', image: '' })) };
let checks = 0;
function check(condition, description) { assert.ok(condition, description); checks++; }
async function text(page, selector) { return page.locator(selector).innerText(); }
async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  check(sizes.scroll <= sizes.width + 1, `${label}: horizontal overflow ${JSON.stringify(sizes)}`);
}
async function pageFor(width, height = 900, payload = catalog, reducedMotion = 'reduce', newsMode = 'ok') {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const newsRequests = [];
  const newsControl = { mode: newsMode };
  await context.route('**/api/plans', (route) => route.fulfill({ status: payload === null ? 503 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(payload || {}) }));
  await context.route('**/noticias.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(news) }));
  await context.route('**/api/noticias', async (route) => {
    newsRequests.push(route.request().url());
    const primary = new URL(route.request().url()).hostname === 'app.useaggi.com';
    if (newsControl.mode === 'timeout-primary' && primary) {
      await new Promise(resolve => setTimeout(resolve, 4500));
      await route.fulfill({ status: 503, body: '{}' }).catch(() => {});
      return;
    }
    const unavailable = newsControl.mode === 'down' || (newsControl.mode === 'primary-down' && primary);
    let data = news;
    if (newsControl.mode === 'empty') data = { items: [] };
    if (newsControl.mode === 'malformed') data = { unexpected: true };
    if (newsControl.mode === 'unsafe') data = { items: [null, { title: 'Unsafe', url: 'javascript:alert(1)' }, ...news.items] };
    await route.fulfill({ status: unavailable ? 503 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
  });
  // No registrations, WhatsApp sends or payments. Clipboard is scoped to this test.
  await context.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copied = value; } } }));
  const page = await context.newPage();
  const errors = [];
  const failedLocal = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) failedLocal.push(response.url()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors, failedLocal, newsRequests, newsControl };
}

try {
  const { context, page, errors, failedLocal, newsRequests } = await pageFor(1440);
  check(newsRequests.length === 0, 'News API is not called before its section is opened');
  check(await page.locator('h1').count() === 1, 'One main heading');
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === 'https://useaggi.com/', 'Landing canonical uses the main domain');
  check(await page.locator('.header-login').getAttribute('href') === 'https://app.useaggi.com/', 'Login opens the app subdomain root');
  check(await page.locator('.header-cta').getAttribute('href') === 'https://app.useaggi.com/cadastro?origin=landing', 'Signup opens the React flow on the app subdomain');
  check(await page.locator('meta[name="agassist-plans-json"]').getAttribute('content') === 'https://app.useaggi.com/api/plans', 'Catalog uses the app API');
  check((await text(page, 'body')).includes('Lida, no WhatsApp'), 'Clear product roles');
  const invalidLinks = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].filter((link) => !document.getElementById(link.getAttribute('href').slice(1))).map((link) => link.getAttribute('href')));
  check(invalidLinks.length === 0, `Valid internal anchors: ${invalidLinks}`);
  check(await page.locator('img[fetchpriority="high"]').evaluate((img) => img.complete && img.naturalWidth > 0), 'Hero image loaded');
  await noOverflow(page, 'Desktop');
  await page.screenshot({ path: resolve(artifacts, 'desktop-hero.png') });
  await page.locator('.header-nav-desktop a[href="#recursos"]').click();
  check(new URL(page.url()).hash === '#recursos', 'Feature overview is reachable from desktop navigation');
  await noOverflow(page, 'Desktop capabilities');
  await page.locator('#recursos').screenshot({ path: resolve(artifacts, 'desktop-capabilities.png') });
  const resultTitles = { gasto: 'Diesel', agenda: 'Revisar a bomba', producao: 'Colheita de cebolinha', estoque: 'Ração Crescimento', historico: 'Despesas de diesel', duvida: 'Apoio para sua observação' };
  check(await page.locator('#plans-grid a').evaluateAll(links => links.length > 0 && links.every(link => link.href === 'https://app.useaggi.com/planos')), 'Dynamically rendered plan links use the new domain');
  for (const [key, title] of Object.entries(resultTitles)) {
    await page.locator(`[data-example="${key}"]`).click();
    check(await text(page, '#example-result-title') === title, `${key} example shows its result`);
    check(await page.locator('[role="tab"][aria-selected="true"]').count() === 1, `${key}: exactly one selected tab`);
    check(await page.locator('#example-panel').getAttribute('aria-labelledby') === `example-${key}-tab`, `${key}: panel label`);
  }
  await page.locator('[data-example="gasto"]').focus();
  await page.keyboard.press('ArrowRight');
  check(await page.locator('[data-example="agenda"]').getAttribute('aria-selected') === 'true', 'Arrow key changes tab');
  await page.keyboard.press('End');
  check(await page.locator('[data-example="duvida"]').evaluate((node) => node === document.activeElement), 'End focuses last tab');
  await page.keyboard.press('Home');
  check(await page.locator('[data-example="gasto"]').getAttribute('aria-selected') === 'true', 'Home selects first tab');
  await page.locator('#experiencia').screenshot({ path: resolve(artifacts, 'desktop-examples.png') });
  for (const key of ['agricultura', 'bovinos', 'equinos', 'criacoes', 'agua', 'outras']) {
    await page.locator(`[data-activity="${key}"]`).click();
    check(await page.locator('[data-activity][aria-pressed="true"]').count() === 1, `${key}: one selected activity`);
    check((await text(page, '#activity-message')).length > 30, `${key}: useful example`);
    check(await page.locator('#activity-features li').count() === 3, `${key}: activity features`);
  }
  await page.locator('[data-activity="equinos"]').click();
  check((await text(page, '#activity-features')).includes('Alimentação em kg'), 'Equine animal care uses declared units');
  await page.locator('#atividades').screenshot({ path: resolve(artifacts, 'desktop-activities.png') });
  await page.locator('#copy-first-message').click();
  check(await page.evaluate(() => window.__copied) === 'Oi, Lida! Quero começar a organizar minha propriedade.', 'Copy first message');
  check((await text(page, '#copy-first-message')).includes('copiada'), 'Clipboard success feedback');
  await page.locator('#planos').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#plans-grid').dataset.segment === 'personal');
  check(await page.locator('#plans-grid .plan').count() === 3, 'Three personal plans');
  check((await text(page, '#plans-grid')).includes('35 análises'), 'Current analysis cap');
  await page.locator('[data-plan-segment="company"]').click();
  check(await page.locator('#plans-grid .plan').count() === 1, 'One company plan');
  check((await text(page, '#plans-grid')).includes('Business'), 'Business plan');
  check(await text(page, '#plans-grid .price strong') === '199', 'Business price');
  check((await text(page, '#plans-grid')).includes('Até 5 números'), 'Company seat maximum');
  await page.locator('[data-plan-segment="personal"]').click();
  check(await page.locator('#plans-grid .plan').count() === 3, 'Switch back to personal');
  await page.locator('#planos').screenshot({ path: resolve(artifacts, 'desktop-plans.png') });
  const signupLinks = await page.locator('a[href*="/cadastro"]').evaluateAll((links) => links.map((link) => link.href));
  check(signupLinks.length > 0 && signupLinks.every((href) => href.startsWith('https://app.useaggi.com/cadastro')), 'Signup CTAs point to the app signup');
  await page.locator('.faq summary').first().click();
  check(await page.locator('.faq details').first().getAttribute('open') !== null, 'FAQ expands');
  await page.locator('#faq').screenshot({ path: resolve(artifacts, 'desktop-faq.png') });
  await page.locator('footer a[href="#cotacoes"]').click();
  check(await page.locator('#cotacoes').evaluate((node) => node.open), 'Quote anchor opens section');
  await page.locator('footer a[href="#noticias"]').click();
  check(await page.locator('#noticias').evaluate((node) => node.open), 'News anchor opens section');
  await page.waitForFunction(() => document.querySelector('#noticias-wrap').getBoundingClientRect().height > 230);
  check(newsRequests.length === 1 && newsRequests[0].includes('app.useaggi.com'), 'Local preview uses the configured live API instead of the old JSON file');
  check((await text(page, '#noticias-status')).includes('Última atualização'), 'News feed exposes its update date');
  check(await page.locator('.news-card').nth(3).evaluate((node) => node.inert), 'Clipped news is not focusable');
  await page.locator('#noticias-ver-mais').click();
  check(await page.locator('#noticias-ver-mais').getAttribute('aria-expanded') === 'true', 'Expand news');
  check(!await page.locator('.news-card').nth(3).evaluate((node) => node.inert), 'Expanded news accessible');
  await page.locator('#noticias-ver-mais').click();
  check(await page.locator('#noticias-ver-mais').getAttribute('aria-expanded') === 'false', 'Collapse news');
  check(errors.length === 0, `No browser errors: ${errors}`);
  check(failedLocal.length === 0, `No missing assets: ${failedLocal}`);
  await page.locator('footer').screenshot({ path: resolve(artifacts, 'desktop-footer.png') });
  await context.close();

  for (const width of [768, 390, 320]) {
    const { context, page, errors } = await pageFor(width, width === 768 ? 1024 : 844);
    await noOverflow(page, `${width}px hero`);
    await page.screenshot({ path: resolve(artifacts, `${width}-hero.png`) });
    await page.locator('#recursos').scrollIntoViewIfNeeded();
    await noOverflow(page, `${width}px capabilities`);
    if (width === 390) await page.locator('#recursos').screenshot({ path: resolve(artifacts, 'mobile-capabilities.png') });
    await page.locator('[data-example="producao"]').click();
    await noOverflow(page, `${width}px examples`);
    check(await text(page, '#example-value') === '20 maços', `${width}px interactive example`);
    if (width === 390) await page.locator('#experiencia').screenshot({ path: resolve(artifacts, 'mobile-examples.png') });
    await page.locator('[data-activity="equinos"]').click();
    await noOverflow(page, `${width}px activities`);
    if (width === 390) await page.locator('#atividades').screenshot({ path: resolve(artifacts, 'mobile-activities.png') });
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.keyboard.press('Escape');
    check(await page.evaluate(() => scrollY) === scrollBefore, `${width}px Escape outside menu does not jump to top`);
    await page.locator('#menu-toggle').click();
    check(await page.locator('#menu').getAttribute('aria-hidden') === 'false', `${width}px menu opens`);
    check(await page.locator('main').evaluate((node) => node.inert), `${width}px background inert`);
    await page.locator('#menu .nav-sheet a').last().focus();
    await page.keyboard.press('Tab');
    check(await page.locator('#menu-toggle').evaluate((node) => node === document.activeElement), `${width}px focus trapped`);
    await page.keyboard.press('Escape');
    check(await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false', `${width}px Escape closes menu`);
    check(!await page.locator('main').evaluate((node) => node.inert), `${width}px background restored`);
    await page.locator('#menu-toggle').click();
    await page.locator('#menu a[href="#recursos"]').click();
    check(await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false', `${width}px feature navigation closes the menu`);
    check(await page.locator('#recursos').evaluate((node) => node === document.activeElement), `${width}px feature navigation places focus in the section`);
    await page.locator('#menu-toggle').click();
    await page.locator('#menu a[href="#planos"]').click();
    check(await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false', `${width}px menu anchor closes menu`);
    await page.locator('[data-plan-segment="company"]').click();
    await noOverflow(page, `${width}px company plan`);
    check((await text(page, '#plans-grid')).includes('Business'), `${width}px company switch`);
    await page.locator('[data-plan-segment="personal"]').click();
    await noOverflow(page, `${width}px personal plans`);
    if (width === 390) await page.locator('#planos').screenshot({ path: resolve(artifacts, 'mobile-plans.png') });
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await noOverflow(page, `${width}px FAQ`);
    if (width === 390) await page.locator('#faq').screenshot({ path: resolve(artifacts, 'mobile-faq.png') });
    await page.locator('footer').scrollIntoViewIfNeeded();
    await noOverflow(page, `${width}px footer`);
    if (width === 390) await page.locator('footer').screenshot({ path: resolve(artifacts, 'mobile-footer.png') });
    check(errors.length === 0, `${width}px no browser errors`);
    await context.close();
  }
  const failure = await pageFor(390, 844, null);
  await failure.page.locator('[data-plan-segment="company"]').click();
  await failure.page.waitForFunction(() => document.querySelector('#plans-note').textContent.includes('Não foi possível atualizar'));
  check((await text(failure.page, '#plans-grid')).includes('Business'), 'Catalog failure preserves correct company segment');
  check(await text(failure.page, '#plans-grid .price strong') === '199', 'Catalog failure uses verified snapshot');
  await failure.page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await failure.page.locator('#copy-first-message').click();
  check((await text(failure.page, '#copy-first-message')).includes('Selecione'), 'Clipboard fallback does not falsely confirm');
  await failure.context.close();
  const changed = structuredClone(catalog); changed.plans[0].priceBrl = 31.5; changed.plans[0].bullets[0] = 'Até 37 análises por mês';
  const update = await pageFor(1440, 900, changed);
  await update.page.locator('#planos').scrollIntoViewIfNeeded();
  await update.page.waitForFunction(() => document.querySelector('#plans-grid').textContent.includes('37 análises'));
  check((await text(update.page, '#plans-grid')).includes('37 análises'), 'API supersedes the analysis cap snapshot');
  check(await update.page.locator('#plans-grid .price strong').first().innerText() === '31,50', 'API decimal currency formatting');
  await update.context.close();
  const backup = await pageFor(390, 844, catalog, 'reduce', 'primary-down');
  await backup.page.locator('#noticias summary').click();
  await backup.page.waitForFunction(() => document.querySelector('#noticias-grid .news-card__title')?.textContent.includes('Notícia de teste'));
  check(backup.newsRequests.length === 2 && backup.newsRequests[1].includes('up.railway.app'), 'Unavailable app domain falls back to the operational Railway endpoint');
  check(await backup.page.locator('#noticias-atualizar').isEnabled(), 'News refresh is available after fallback');
  backup.newsControl.mode = 'down';
  await backup.page.locator('#noticias-atualizar').click();
  await backup.page.waitForFunction(() => document.querySelector('#noticias-status').textContent.includes('notícias salvas'));
  check(await backup.page.locator('.news-card').count() === 6, 'A provider failure preserves cached articles with an explicit stale status');
  await backup.page.evaluate(() => localStorage.setItem('campoai-noticias-cache::https://app.useaggi.com/api/noticias', JSON.stringify({
    savedAt: Date.now(), payload: { fetchedAt: '2026-08-31T00:39:53.432Z', items: [{ title: 'Arquivo antigo', url: 'https://www.embrapa.br/' }] }
  })));
  await backup.page.locator('#noticias-atualizar').click();
  await backup.page.waitForFunction(() => document.querySelector('#noticias-status').textContent.includes('Não conseguimos carregar'));
  check(!(await text(backup.page, '#noticias-grid')).includes('Arquivo antigo'), 'Expired articles are not presented as fresh news');
  check(await backup.page.locator('.news-card').count() === 3, 'Provider failure shows identifiable source links');
  backup.newsControl.mode = 'ok';
  await backup.page.locator('#noticias-atualizar').click();
  await backup.page.waitForFunction(() => document.querySelector('#noticias-status').textContent.includes('Última atualização'));
  check((await text(backup.page, '#noticias-grid')).includes('Notícia de teste'), 'Refresh recovers the feed after an outage');
  await noOverflow(backup.page, '390px news toolbar');
  await backup.page.locator('#noticias').screenshot({ path: resolve(artifacts, 'mobile-news.png') });
  check(backup.errors.length === 0, 'No script errors during cache and retry paths');
  await backup.context.close();
  for (const mode of ['empty', 'malformed', 'unsafe', 'timeout-primary']) {
    const scenario = await pageFor(320, 844, catalog, 'reduce', mode);
    await scenario.page.locator('#noticias summary').click();
    await scenario.page.waitForFunction(() => document.querySelector('#noticias-grid').getAttribute('aria-busy') === 'false');
    if (mode === 'empty') check((await text(scenario.page, '#noticias-status')).includes('Ainda não há notícias'), 'Empty feed is explained rather than silently replaced');
    if (mode === 'malformed') check((await text(scenario.page, '#noticias-status')).includes('Não conseguimos carregar'), 'Malformed feeds end loading and offer a retry');
    if (mode === 'unsafe') check(await scenario.page.locator('.news-card').count() === 6, 'Invalid records and unsafe article URLs are skipped');
    if (mode === 'timeout-primary') check(scenario.newsRequests.length === 2 && (await text(scenario.page, '#noticias-grid')).includes('Notícia de teste'), 'A stalled request times out and falls back');
    await noOverflow(scenario.page, '320px ' + mode + ' news');
    check(await scenario.page.locator('#noticias-atualizar').isEnabled(), mode + ': loading finishes with refresh available');
    check(scenario.errors.length === 0, mode + ': no browser errors');
    await scenario.context.close();
  }
  console.log(`${checks} verificações passaram. Capturas em ${artifacts}`);
} finally { await browser.close(); await new Promise((done) => server.close(done)); }
