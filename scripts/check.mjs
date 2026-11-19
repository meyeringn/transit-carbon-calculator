// Static checks that catch the mistakes AI-assisted edits make most often.
// Run: npm run check (no dependencies). Adapted from BallotGap PHL.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const html = read('index.html');
const css = read('css/styles.css');
const jsFiles = ['js/data.js', 'js/core.js', 'js/app.js', 'js/analytics.js'];
const js = jsFiles.map(read).join('\n');
const readme = read('README.md');
const data = require('../js/data.js');
const pkg = JSON.parse(read('package.json'));
const problems = [];
const fail = msg => problems.push(msg);

// 1. No inline scripts or handlers, so the CSP can forbid them.
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!/\bsrc=/.test(m[1])) fail('Inline <script> found. Put code in js/ so the CSP can block injected scripts.');
}
if (/\son[a-z]+\s*=\s*["']/i.test(html)) fail('Inline event handler (onclick= etc.) found. Use addEventListener in js/app.js.');
if (/\sstyle\s*=\s*["']/i.test(html)) fail('Inline style="" found. The CSP blocks it; use a class in css/styles.css.');

// 2. The CSP allows every outside host the page uses, and nothing unsafe.
const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
if (!csp) fail('Content-Security-Policy meta tag is missing.');
if (/'unsafe-(inline|eval)'/.test(csp)) fail("CSP must not allow 'unsafe-inline' or 'unsafe-eval'.");
const directive = name => (csp.match(new RegExp(`${name} ([^;]+)`)) || [])[1] || '';
const allowed = (dir, url) => directive(dir).split(/\s+/).some(src => src.startsWith('https://') && new URL(url).host === src.replace('https://', '').replace(/\/.*$/, ''));
for (const m of html.matchAll(/<script[^>]+src="(https:[^"]+)"/g)) if (!allowed('script-src', m[1])) fail(`Script ${m[1]} is not allowed by CSP script-src.`);
if (/<link[^>]+rel="stylesheet"[^>]+href="https:/.test(html)) fail('Remote stylesheet found. Styles and fonts are self-hosted.');
if (!allowed('connect-src', data.gasPriceApi.url)) fail('EIA gas price API is not in CSP connect-src.');
const goat = (html.match(/data-goatcounter="([^"]+)"/) || [])[1];
if (goat && !allowed('connect-src', goat)) fail('GoatCounter endpoint is not in CSP connect-src.');

// 3. Local files the page and CSS reference exist.
for (const m of html.matchAll(/(?:src|href)="((?:js|css|fonts)\/[^"]+|favicon\.svg)"/g)) {
  if (!existsSync(new URL(`../${m[1]}`, import.meta.url))) fail(`Missing file: ${m[1]}`);
}
for (const m of css.matchAll(/url\('\.\.\/([^']+)'\)/g)) {
  if (!existsSync(new URL(`../${m[1]}`, import.meta.url))) fail(`CSS references a missing file: ${m[1]}`);
}

// 4. Design rules from docs/DESIGN.md.
if (/\bInter\b/.test(css + html)) fail('Inter font found. This project uses Atkinson Hyperlegible Next and Overpass (see docs/DESIGN.md).');
if (/linear-gradient\((?!\s*\d+deg,\s*var\(--car\))/.test(css)) fail('Decorative linear-gradient found. Only the hatched car bar may use one.');
if (/box-shadow:\s*0 \d+px \d{2,}px/.test(css)) fail('Soft drop shadow found. Use flat borders (see docs/DESIGN.md).');
const emoji = /\p{Extended_Pictographic}/u;
if (emoji.test(html.replace(/<!--[\s\S]*?-->/g, '')) || emoji.test(js)) fail('Emoji found in page or JS copy. Screen readers read them aloud; use words.');
if (/\balert\(|\bprompt\(|\bconfirm\(/.test(js)) fail('alert()/prompt()/confirm() found. Use the role="status" message instead.');
if (/—/.test(html + js)) fail('Em dash found in page or JS copy. Use a period, comma, or colon.');

// 5. Color contrast for every token pair the design relies on.
const tokens = Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map(m => [m[1], m[2]]));
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ['ink', 'paper', 4.5], ['ink', 'card', 4.5], ['ink-soft', 'card', 4.5], ['ink-soft', 'paper', 4.5],
  ['link', 'card', 4.5], ['error', 'card', 4.5], ['error', 'error-tint', 4.5],
  ['on-ink', 'ink', 4.5], ['on-ink-soft', 'ink', 4.5], ['yellow', 'ink', 4.5],
  ['rule', 'card', 3], ['ride', 'card', 3], ['car', 'card', 3], ['ride', 'paper', 3], ['car', 'paper', 3],
];
for (const [fg, bg, min] of pairs) {
  if (!tokens[fg] || !tokens[bg]) { fail(`Contrast check: token --${fg} or --${bg} is missing.`); continue; }
  const r = ratio(tokens[fg], tokens[bg]);
  if (r < min) fail(`Contrast --${fg} on --${bg} is ${r.toFixed(2)}:1, needs ${min}:1.`);
}

// 6. Versions and dates agree.
if (pkg.version !== data.version) fail(`package.json is ${pkg.version} but js/data.js is ${data.version}.`);
const shownVersion = (html.match(/data-version>([^<]*)</) || [])[1];
if (shownVersion !== data.version) fail(`index.html footer shows version ${shownVersion}, data.js says ${data.version}.`);
if (!readme.includes(`**Data last verified:** ${data.verified}`)) fail(`README "Data last verified" must say ${data.verified} (from js/data.js).`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.verifiedISO)) fail('data.verifiedISO must be YYYY-MM-DD.');

// 7. The README methodology table matches the factors the code uses.
for (const m of Object.values(data.modes)) {
  if (m.kgCO2ePerPassengerMile > 0 && !readme.includes(String(m.kgCO2ePerPassengerMile))) fail(`README methodology is missing the ${m.label} factor ${m.kgCO2ePerPassengerMile}.`);
}
if (!readme.includes(data.gasoline.gramsCO2PerGallon.toLocaleString('en-US'))) fail('README methodology is missing the 8,887 g CO2 per gallon figure.');
const agencyCount = data.agencies.filter(a => a.group !== 'Other').length;
for (const m of (html + readme).matchAll(/(\d+) (?:Pennsylvania )?transit agencies/g)) {
  if (Number(m[1]) !== agencyCount) fail(`Copy says "${m[0]}" but data.js lists ${agencyCount} agencies.`);
}

// 8. Language the project has committed to.
if (/person(s)? with (a )?disabilit|people with disabilit/i.test(html + js + readme)) fail('Use identity-first language ("Disabled riders").');
if (/\bagency-specific estimates\b/i.test(html + readme)) fail('Results use national factors. Don\'t call them agency-specific until they are.');

if (problems.length) {
  console.error(`check: ${problems.length} problem(s)\n - ` + problems.join('\n - '));
  process.exit(1);
}
console.log('check: all static checks passed');
