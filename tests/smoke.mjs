// Offline browser smoke test: serves the repo, fakes the EIA API, blocks every
// other outside host, and checks the main rider flows at phone and desktop width.
// Run: npm run test:e2e (needs Playwright + Chromium). SCREENSHOTS=dir saves pictures.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright')); }

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff': 'font/woff', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  try { const body = await readFile(join(ROOT, path)); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const SHOTS = process.env.SCREENSHOTS;
if (SHOTS) await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const failures = [];
async function check(name, fn) {
  try { await fn(); console.log('  ok  ', name); }
  catch (e) { failures.push(name); console.log('  FAIL', name, '\n       ', e.message.split('\n')[0]); }
}

async function openPage({ width = 1280, height = 900, gas = 'ok', reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion, acceptDownloads: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/i.test(m.text())) errors.push(m.text()); });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    if (url.includes('api.eia.gov')) {
      return gas === 'ok'
        ? route.fulfill({ json: { response: { data: [{ period: '2026-11-16', value: '3.187' }] } } })
        : route.fulfill({ status: 429, body: 'rate limited' });
    }
    return route.abort();
  });
  await page.goto(base);
  await page.waitForFunction(() => !/Checking/.test(document.getElementById('gasPrice-hint').textContent));
  return { page, errors, context };
}

async function fillTrip(page, { miles = '8', days = '5', mode = 'bus', agency = 'septa' } = {}) {
  await page.check(`input[name=mode][value=${mode}]`);
  await page.fill('#oneWayMiles', miles);
  await page.fill('#daysPerWeek', days);
  if (agency) await page.selectOption('#agency', agency);
  await page.click('button[type=submit]');
}

console.log('Transit Carbon Calculator smoke test');
const { page, errors } = await openPage();

await check('loads with no script errors and builds the form from data.js', async () => {
  assert.equal(await page.locator('input[name=mode]').count(), 5);
  assert.ok(await page.locator('#agency option').count() >= 12);
  assert.ok(await page.locator('#factorRows tr').count() >= 6);
  assert.deepEqual(errors, []);
});
await check('live gas price fills in with its date and source', async () => {
  assert.equal(await page.inputValue('#gasPrice'), '3.19');
  assert.match(await page.textContent('#gasPrice-hint'), /Central Atlantic average for the week of Nov 16: \$3\.19 \(EIA\)/);
});
await check('every form control has an accessible name', async () => {
  const unnamed = await page.$$eval('input, select, textarea, button', els => els.filter(el => {
    if (el.closest('[hidden]')) return false;
    const id = el.id && document.querySelector(`label[for="${el.id}"]`);
    return !(id || el.closest('label') || el.getAttribute('aria-label') || el.textContent.trim());
  }).map(el => el.id || el.name));
  assert.deepEqual(unnamed, []);
});
await check('empty submit shows a focused error summary and marks fields invalid', async () => {
  await page.click('button[type=submit]');
  assert.equal(await page.isVisible('#errorSummary'), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'errorSummary');
  assert.equal(await page.getAttribute('#oneWayMiles', 'aria-invalid'), 'true');
  assert.match(await page.textContent('#oneWayMiles-error'), /number/);
  await page.click('#errorList a >> nth=0');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'oneWayMiles');
});
await check('a bus commute shows sourced results and moves focus to them', async () => {
  await fillTrip(page);
  await page.waitForSelector('#results:not([hidden])');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'resultsTitle');
  assert.match(await page.textContent('#headline'), /Riding the bus instead of driving avoids about 2,850 lbs of CO₂ a year/);
  assert.match(await page.textContent('[data-period=annual]'), /^2,850/);
  assert.match(await page.textContent('[data-period=week]'), /^57/);
  assert.match(await page.textContent('#agencyLine'), /SEPTA/);
  assert.equal(await page.textContent('#statMiles'), '4,000');
  assert.equal(await page.textContent('#statDollars'), '$560');
  assert.equal(await page.isVisible('#errorSummary'), false);
});
await check('the years slider moves the last stop', async () => {
  await page.fill('#years', '25');
  assert.equal(await page.textContent('#spanLabel'), '25 years');
  assert.match(await page.textContent('[data-period=span]'), /^71,249/);
  assert.equal(await page.getAttribute('#years', 'aria-valuetext'), '25 years');
});
await check('copy a post puts plain text with the link on the clipboard', async () => {
  await page.click('#copyPost');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(text, /on SEPTA instead of driving/);
  assert.match(text, /meyeringn\.github\.io\/transit-carbon-calculator/);
  await page.waitForFunction(() => /Post copied/.test(document.getElementById('shareStatus').textContent));
});
await check('download image saves a PNG and offers alt text', async () => {
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#downloadCard')]);
  assert.equal(download.suggestedFilename(), 'my-transit-carbon-savings.png');
  await page.waitForFunction(() => /Alt text you can paste with it: Transit Carbon Calculator card/.test(document.getElementById('shareStatus').textContent));
});
if (SHOTS) await page.screenshot({ path: `${SHOTS}/desktop-results.png`, fullPage: true, animations: 'disabled' });
await check('start over clears results and keeps the live gas price', async () => {
  await page.click('#startOver');
  assert.equal(await page.isVisible('#results'), false);
  assert.equal(await page.inputValue('#oneWayMiles'), '');
  assert.equal(await page.inputValue('#gasPrice'), '3.19');
});
await check('keyboard only: Enter in a field submits the form', async () => {
  await page.fill('#oneWayMiles', '3');
  await page.fill('#daysPerWeek', '4');
  await page.focus('#daysPerWeek');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#results:not([hidden])');
});
await page.context().close();

await check('gas price failure falls back to an editable default with a clear note', async () => {
  const { page: p, context } = await openPage({ gas: 'fail' });
  assert.equal(await p.inputValue('#gasPrice'), '3.50');
  assert.match(await p.textContent('#gasPrice-hint'), /Couldn't load this week's price/);
  await context.close();
});
await check('phone width (390px): no sideways scrolling, vertical line diagram', async () => {
  const { page: p, context } = await openPage({ width: 390, height: 844, reducedMotion: 'reduce' });
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/phone-form.png`, fullPage: true, animations: 'disabled' });
  await fillTrip(p, { mode: 'commuter', miles: '14', days: '3', agency: 'prt' });
  await p.waitForSelector('#results:not([hidden])');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `page scrolls sideways by ${overflow}px`);
  const [a, b] = await p.$$eval('.stop', els => els.slice(0, 2).map(e => e.getBoundingClientRect().top));
  assert.ok(b > a, 'stops should stack vertically on a phone');
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/phone-results.png`, fullPage: true, animations: 'disabled' });
  await context.close();
});
await check('a very efficient car shows a signed result, never a fake zero', async () => {
  const { page: p, context } = await openPage();
  await p.fill('#mpg', '80');
  await fillTrip(p, { mode: 'commuter', agency: '' });
  assert.match(await p.textContent('#headline'), /car this efficient/);
  assert.match(await p.textContent('[data-period=annual]'), /more CO₂ than this car/);
  await context.close();
});
await check('walk or roll shows zero ride emissions', async () => {
  const { page: p, context } = await openPage();
  await fillTrip(p, { mode: 'walk', miles: '1', days: '5', agency: '' });
  assert.match(await p.textContent('#headline'), /^Walking or rolling instead of driving/);
  assert.equal(await p.textContent('#barRideValue'), '0 lbs');
  await context.close();
});

await browser.close();
server.close();
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nsmoke: all checks passed');
