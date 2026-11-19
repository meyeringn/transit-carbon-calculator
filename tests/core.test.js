// Unit tests for js/core.js and js/data.js. Run: npm test (Node 18+, no dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/data.js');
const core = require('../js/core.js');

const base = { mode: 'bus', oneWayMiles: 8, daysPerWeek: 5, mpg: 22.8, gasPrice: 3.5, years: 10 };
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} should be within ${tol} of ${b}`);

test('factors match their published sources', () => {
  // EPA GHG Emission Factors Hub (2025), Table 10, kg CO2e per passenger-mile
  assert.equal(data.modes.bus.kgCO2ePerPassengerMile, 0.0666);
  assert.equal(data.modes.rail.kgCO2ePerPassengerMile, 0.0935);
  assert.equal(data.modes.commuter.kgCO2ePerPassengerMile, 0.134);
  assert.equal(data.gasoline.gramsCO2PerGallon, 8887); // EPA typical passenger vehicle
  assert.equal(data.equivalencies.metricTonsPerTreeSeedling10yr, 0.06);
  for (const m of Object.values(data.modes)) {
    if (m.kgCO2ePerPassengerMile > 0) assert.ok(data.sources[m.source], `${m.label} needs a source`);
  }
});

test('car CO2 per mile follows the mpg the rider enters', () => {
  near(core.carLbsPerMile(22.8, data), 0.8593, 0.0005); // 8,887 g / 22.8 mpg = 390 g
  near(core.carLbsPerMile(40, data), 0.4898, 0.0005);
  assert.ok(core.carLbsPerMile(15, data) > core.carLbsPerMile(30, data));
});

test('a worked example: 8 miles each way, 5 days, bus', () => {
  const r = core.calculate(base, data);
  assert.equal(r.annual.miles, 4000);              // 8 x 2 x 5 x 50
  near(r.annual.carLbs, 3437.2, 0.5);              // 4000 x 0.8593
  near(r.annual.rideLbs, 587.3, 0.5);              // 4000 x 0.0666 x 2.2046
  near(r.annual.savedLbs, 2849.9, 1);
  near(r.annual.gallons, 175.44, 0.01);
  near(r.annual.dollars, 614.04, 0.01);
  near(r.annual.treeSeedlings, 2849.9 / 132.277, 0.05);
});

test('periods scale from the annual number', () => {
  const r = core.calculate(base, data);
  near(r.week.savedLbs * data.weeksPerYear, r.annual.savedLbs);
  near(r.month.savedLbs * 12, r.annual.savedLbs);
  near(r.span.savedLbs, r.annual.savedLbs * 10);
  near(core.calculate({ ...base, years: 25 }, data).span.miles, 100000);
});

test('bike and walk-or-roll have zero ride emissions', () => {
  for (const mode of ['bike', 'walk']) {
    const r = core.calculate({ ...base, mode }, data);
    assert.equal(r.annual.rideLbs, 0);
    near(r.annual.savedLbs, r.annual.carLbs);
    assert.match(core.headline(r, data), /zero tailpipe/);
  }
});

test('rail modes rank as EPA publishes them', () => {
  const lbs = mode => core.calculate({ ...base, mode }, data).annual.rideLbs;
  assert.ok(lbs('bus') < lbs('rail') && lbs('rail') < lbs('commuter'));
});

test('a very efficient car can beat the average, and the page says so honestly', () => {
  const r = core.calculate({ ...base, mode: 'commuter', mpg: 80 }, data);
  assert.ok(r.annual.savedLbs < 0);
  assert.equal(r.annual.treeSeedlings, 0);
  assert.match(core.headline(r, data), /car this efficient/);
  assert.doesNotMatch(core.sharePost(r, data), /keeps about -/);
  assert.deepEqual(core.savedParts(-40), { value: '40', unit: 'lbs more CO₂ than this car' });
  assert.match(core.imageAltText(r, data), /more CO₂ a year than this very efficient car/);
  assert.doesNotMatch(core.imageAltText(r, data), /-\d/);
});

test('validate: accepts good input and converts strings', () => {
  const v = core.validate({ mode: 'rail', oneWayMiles: '3.5', daysPerWeek: '4', mpg: '30', gasPrice: '3.19', years: '10' }, data);
  assert.equal(v.ok, true);
  assert.equal(v.values.oneWayMiles, 3.5);
});

test('validate: names every bad field', () => {
  const v = core.validate({ mode: 'boat', oneWayMiles: '', daysPerWeek: '9', mpg: '0', gasPrice: 'abc', years: '10' }, data);
  assert.equal(v.ok, false);
  assert.deepEqual(v.errors.map(e => e.field).sort(), ['daysPerWeek', 'gasPrice', 'mode', 'mpg', 'oneWayMiles']);
  assert.match(core.validate({ ...base, daysPerWeek: '2.5' }, data).errors[0].message, /whole number/);
});

test('formatting: commas, money, no negative zero', () => {
  assert.equal(core.number(2849.9), '2,850');
  assert.equal(core.number(4.25), '4.3');
  assert.equal(core.number(-0.01), '0');
  assert.equal(core.money(614.04), '$614');
  assert.equal(core.money(12.3), '$12.30');
});

test('share text: plain language, link, agency, no em dashes', () => {
  const r = core.calculate(base, data);
  const post = core.sharePost(r, data, 'SEPTA');
  assert.match(post, /Riding the bus on SEPTA instead of driving/);
  assert.match(post, /2,850 lbs of CO₂/);
  assert.ok(post.includes(data.siteUrl));
  assert.doesNotMatch(post, /—/);
  assert.match(core.imageAltText(r, data, 'SEPTA'), /^Transit Carbon Calculator card\./);
});

test('agencies use current names', () => {
  const names = data.agencies.map(a => a.name).join(' | ');
  assert.match(names, /Pittsburgh Regional Transit/);
  assert.doesNotMatch(names, /^Port Authority/m);
  assert.equal(new Set(data.agencies.map(a => a.id)).size, data.agencies.length);
});
