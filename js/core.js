// Pure math and wording, with no DOM or network access, so it can be
// unit-tested in Node (tests/core.test.js). Keep it that way: anything that
// touches `document`, `fetch`, or the clipboard belongs in app.js.
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else (root.TCC = root.TCC || {}).core = core;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const LIMITS = {
    oneWayMiles: { min: 0.1, max: 200, label: 'One-way distance', unit: 'miles' },
    daysPerWeek: { min: 1, max: 7, label: 'Days per week', unit: 'days' },
    mpg: { min: 5, max: 150, label: 'Miles per gallon', unit: 'mpg' },
    gasPrice: { min: 0, max: 20, label: 'Gas price', unit: 'dollars' },
    years: { min: 1, max: 40, label: 'Years', unit: 'years' },
  };

  /** Check raw form values. Returns { ok, values, errors: [{ field, message }] }. */
  function validate(raw, data) {
    const errors = [];
    const values = {};
    const num = v => (v === '' || v === null || v === undefined ? NaN : Number(v));

    if (!data.modes[raw.mode]) errors.push({ field: 'mode', message: 'Choose how you ride.' });
    values.mode = raw.mode;

    for (const field of ['oneWayMiles', 'daysPerWeek', 'mpg', 'gasPrice', 'years']) {
      const lim = LIMITS[field];
      const n = num(raw[field]);
      if (!Number.isFinite(n)) {
        errors.push({ field, message: `Enter ${lim.label.toLowerCase()} as a number.` });
      } else if (n < lim.min || n > lim.max) {
        errors.push({ field, message: `${lim.label} must be between ${lim.min} and ${lim.max} ${lim.unit}.` });
      } else if (field === 'daysPerWeek' && !Number.isInteger(n)) {
        errors.push({ field, message: 'Days per week must be a whole number, 1 to 7.' });
      }
      values[field] = n;
    }
    return { ok: errors.length === 0, values, errors };
  }

  /** Pounds of CO2 per mile for the car you would otherwise drive. */
  function carLbsPerMile(mpg, data) {
    return (data.gasoline.gramsCO2PerGallon / 1000) * data.lbsPerKg / mpg;
  }

  /** Pounds of CO2e per passenger-mile for a transit or active mode. */
  function rideLbsPerMile(mode, data) {
    return data.modes[mode].kgCO2ePerPassengerMile * data.lbsPerKg;
  }

  /**
   * Annual and per-period results. `savedLbs` can be negative: a very efficient
   * car can beat the national average for a lightly used rail line, and the
   * page says so instead of hiding it.
   */
  function calculate(values, data) {
    const { oneWayMiles, daysPerWeek, mode, mpg, gasPrice, years } = values;
    const annualMiles = oneWayMiles * 2 * daysPerWeek * data.weeksPerYear;
    const carLbs = annualMiles * carLbsPerMile(mpg, data);
    const rideLbs = annualMiles * rideLbsPerMile(mode, data);
    const savedLbs = carLbs - rideLbs;
    const gallons = annualMiles / mpg;
    const lbsPerSeedling = data.equivalencies.metricTonsPerTreeSeedling10yr * 1000 * data.lbsPerKg;
    const lbsPerCharge = data.equivalencies.metricTonsPerSmartphoneCharge * 1000 * data.lbsPerKg;

    const annual = {
      miles: annualMiles,
      carLbs,
      rideLbs,
      savedLbs,
      gallons,
      dollars: gallons * gasPrice,
      treeSeedlings: Math.max(0, savedLbs) / lbsPerSeedling,
      phoneCharges: Math.max(0, savedLbs) / lbsPerCharge,
    };
    const scale = k => Object.fromEntries(Object.entries(annual).map(([key, v]) => [key, v * k]));
    return {
      mode,
      years,
      annual,
      week: scale(1 / data.weeksPerYear),
      month: scale(1 / data.monthsPerYear),
      span: scale(years),
      factors: {
        carLbsPerMile: carLbsPerMile(mpg, data),
        rideLbsPerMile: rideLbsPerMile(mode, data),
      },
    };
  }

  // ── Formatting ──
  const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /** Whole numbers above 10, one decimal below, never "-0". */
  function number(n) {
    const v = Math.abs(n) < 0.05 ? 0 : n;
    return Math.abs(v) >= 10 ? nf0.format(v) : nf1.format(v);
  }
  function lbs(n) { return `${number(n)} lbs`; }
  function money(n) { return Math.abs(n) >= 100 ? usd0.format(n) : usd2.format(n); }
  function plural(n, one, many) { return `${number(n)} ${Math.round(n * 10) / 10 === 1 ? one : many}`; }

  /** "riding the bus", "biking", "walking or rolling": used in every sentence. */
  function going(mode) {
    return { bus: 'riding the bus', rail: 'riding rail transit', commuter: 'riding commuter rail', bike: 'biking', walk: 'walking or rolling' }[mode] || 'riding transit';
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /** Signed stop value: { value, unit } so a negative result is never shown as 0. */
  function savedParts(savedLbs) {
    return savedLbs >= 0
      ? { value: number(savedLbs), unit: 'lbs CO₂ avoided' }
      : { value: number(-savedLbs), unit: 'lbs more CO₂ than this car' };
  }

  /** One plain sentence for the top of the results. */
  function headline(result, data) {
    const m = data.modes[result.mode];
    const saved = result.annual.savedLbs;
    if (result.mode === 'bike' || result.mode === 'walk') {
      return `${cap(going(result.mode))} instead of driving avoids about ${lbs(saved)} of CO₂ a year, with zero tailpipe emissions of your own.`;
    }
    if (saved <= 0) {
      return `With a car this efficient, the same trip by car would emit about ${lbs(-saved)} less CO₂ a year than the national average for ${m.short}. Transit still cuts traffic, crashes, and cost, and it gets cleaner as more people ride.`;
    }
    return `${cap(going(result.mode))} instead of driving avoids about ${lbs(saved)} of CO₂ a year.`;
  }

  /** Ready-to-paste social post. Plain text, no em dashes, link at the end. */
  function sharePost(result, data, agencyName) {
    const a = result.annual;
    const via = agencyName ? ` on ${agencyName}` : '';
    const lines = [
      `I ran my commute through the Transit Carbon Calculator.`,
      '',
      a.savedLbs > 0
        ? `${cap(going(result.mode))}${via} instead of driving keeps about ${lbs(a.savedLbs)} of CO₂ out of the air each year, skips ${number(a.miles)} car miles, and keeps ${money(a.dollars)} in gas money in my pocket.`
        : `${cap(going(result.mode))}${via} instead of driving skips ${number(a.miles)} car miles a year and keeps ${money(a.dollars)} in gas money in my pocket.`,
      '',
      `Transit is climate infrastructure. Fund it like it matters.`,
      '',
      `Find your number: ${data.siteUrl}`,
      '',
      '#TransitEquity #ClimateAction #PublicTransit #Transit4AllPA',
    ];
    return lines.join('\n');
  }

  /** Alt text for the downloadable image, so posts stay accessible. */
  function imageAltText(result, data, agencyName) {
    const via = agencyName ? ` on ${agencyName}` : '';
    const a = result.annual;
    const co2 = a.savedLbs >= 0
      ? `saves about ${lbs(a.savedLbs)} of CO₂ a year`
      : `emits about ${lbs(-a.savedLbs)} more CO₂ a year than this very efficient car would`;
    return `Transit Carbon Calculator card. ${cap(going(result.mode))}${via} instead of driving ${co2}, skips ${number(a.miles)} car miles, and keeps ${money(a.dollars)} in gas money.`;
  }

  return { LIMITS, going, savedParts, validate, calculate, carLbsPerMile, rideLbsPerMile, number, lbs, money, plural, headline, sharePost, imageAltText };
});
