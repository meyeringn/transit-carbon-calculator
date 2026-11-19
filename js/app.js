// DOM, events, the live gas price, and sharing. All math lives in core.js and
// every number lives in data.js. Nothing the rider types is stored, logged,
// or put in a URL.
(function () {
  'use strict';
  const { data, core } = window.TCC;
  const $ = id => document.getElementById(id);
  let last = null; // { values, result, agencyName }
  let livePrice = null; // this week's EIA price, restored after "Start over"

  // ── Build the form from data.js ──
  function buildModes() {
    const wrap = $('modeChoices');
    Object.entries(data.modes).forEach(([key, m], i) => {
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'mode';
      input.value = key;
      if (i === 0) input.checked = input.defaultChecked = true; // defaultChecked survives form.reset()
      const text = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'choice-text';
      name.textContent = m.label;
      const hint = document.createElement('span');
      hint.className = 'choice-hint';
      hint.textContent = m.hint;
      text.append(name, hint);
      label.append(input, text);
      wrap.append(label);
    });
  }

  function buildAgencies() {
    const select = $('agency');
    const groups = {};
    data.agencies.forEach(a => {
      if (!groups[a.group]) {
        groups[a.group] = document.createElement('optgroup');
        groups[a.group].label = a.group === 'Other' ? 'Other' : `${a.group} Pennsylvania`;
        select.append(groups[a.group]);
      }
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.id === 'other_pa' || a.id === 'outside' ? a.name : `${a.name}: ${a.area.split('. ')[0]}`;
      groups[a.group].append(opt);
    });
  }

  function applyDefaults() {
    const mpg = $('mpg'), gas = $('gasPrice');
    mpg.value = mpg.defaultValue = String(data.defaultMpg);
    gas.value = gas.defaultValue = data.defaultGasPrice.toFixed(2);
    $('mpg-hint').textContent = `EPA average: ${data.defaultMpg}`;
  }

  function buildMethod() {
    const lbsPerGallon = data.gasoline.gramsCO2PerGallon / 1000 * data.lbsPerKg;
    document.querySelectorAll('[data-fact]').forEach(el => {
      const f = el.dataset.fact;
      if (f === 'weeksPerYear') el.textContent = data.weeksPerYear;
      if (f === 'gasolineLbs') el.textContent = lbsPerGallon.toFixed(2);
      if (f === 'verified') el.textContent = data.verified;
    });
    const body = $('factorRows');
    const addRow = (cells, sourceKeys) => {
      const tr = document.createElement('tr');
      cells.forEach((c, i) => {
        const td = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) td.scope = 'row';
        if (i === 1 || i === 2) td.className = 'num';
        td.textContent = c;
        tr.append(td);
      });
      const td = document.createElement('td');
      const keys = [].concat(sourceKeys || []);
      keys.forEach((k, i) => {
        if (i) td.append(document.createTextNode('; '));
        const a = document.createElement('a');
        a.href = data.sources[k].url;
        a.textContent = data.sources[k].name;
        td.append(a);
      });
      if (!keys.length) td.textContent = 'No tailpipe';
      tr.append(td);
      body.append(tr);
    };
    Object.values(data.modes).forEach(m => {
      addRow([m.label, String(m.kgCO2ePerPassengerMile), (m.kgCO2ePerPassengerMile * data.lbsPerKg).toFixed(3)], m.source);
    });
    const car = core.carLbsPerMile(data.defaultMpg, data);
    addRow([`Car at ${data.defaultMpg} mpg (you can change mpg)`, (car / data.lbsPerKg).toFixed(3), car.toFixed(3)], [data.gasoline.source, data.defaultMpgSource]);
    document.querySelector('[data-version]').textContent = data.version;
  }

  // ── Live gas price (EIA). Fails quietly to an editable default. ──
  async function loadGasPrice() {
    const hint = $('gasPrice-hint');
    const input = $('gasPrice');
    const fallback = () => { hint.textContent = `Couldn't load this week's price, so we used $${data.defaultGasPrice.toFixed(2)}. Change it to match your pump.`; };
    if (!('fetch' in window) || !('AbortController' in window)) return fallback();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), data.gasPriceApi.timeoutMs);
    try {
      const res = await fetch(data.gasPriceApi.url, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      const row = (await res.json())?.response?.data?.[0];
      const price = Number(row?.value);
      if (!res.ok || !Number.isFinite(price) || price <= 0 || price > 20) throw new Error('no price');
      // Only overwrite if the rider hasn't typed their own price yet.
      livePrice = price.toFixed(2);
      if (input.value === data.defaultGasPrice.toFixed(2)) input.value = livePrice;
      const when = row.period ? new Date(row.period + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'this week';
      hint.textContent = `${data.gasPriceApi.region} average for the week of ${when}: $${price.toFixed(2)} (EIA).`;
    } catch (e) {
      fallback();
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Validation UI ──
  const FIELDS = ['mode', 'oneWayMiles', 'daysPerWeek', 'mpg', 'gasPrice'];
  function clearErrors() {
    FIELDS.forEach(f => {
      const err = $(`${f}-error`);
      if (err) { err.hidden = true; err.textContent = ''; }
      const el = $(f);
      if (el && el.tagName === 'INPUT') el.removeAttribute('aria-invalid');
    });
    $('errorSummary').hidden = true;
    $('errorList').textContent = '';
  }
  function showErrors(errors) {
    const list = $('errorList');
    errors.forEach(({ field, message }) => {
      const err = $(`${field}-error`);
      if (err) { err.textContent = message; err.hidden = false; }
      const el = $(field);
      if (el && el.tagName === 'INPUT') el.setAttribute('aria-invalid', 'true');
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${field === 'mode' ? 'modeChoices' : field}`;
      a.textContent = message;
      a.addEventListener('click', ev => {
        ev.preventDefault();
        (field === 'mode' ? document.querySelector('input[name=mode]') : $(field)).focus();
      });
      li.append(a);
      list.append(li);
    });
    const summary = $('errorSummary');
    summary.hidden = false;
    summary.focus();
  }

  function readForm() {
    return {
      mode: (document.querySelector('input[name=mode]:checked') || {}).value,
      oneWayMiles: $('oneWayMiles').value.trim().replace(/,/g, ''),
      daysPerWeek: $('daysPerWeek').value.trim(),
      mpg: $('mpg').value.trim(),
      gasPrice: $('gasPrice').value.trim().replace(/^\$/, ''),
      years: $('years').value,
    };
  }

  // ── Render ──
  function render(result, agencyName) {
    const periods = { week: result.week, month: result.month, annual: result.annual, span: result.span };
    document.querySelectorAll('.stop-value').forEach(el => {
      const p = periods[el.dataset.period];
      const parts = core.savedParts(p.savedLbs);
      el.textContent = parts.value;
      const small = document.createElement('small');
      small.textContent = parts.unit;
      el.append(small);
    });
    $('spanLabel').textContent = `${result.years} ${result.years === 1 ? 'year' : 'years'}`;
    $('headline').textContent = core.headline(result, data);

    const line = $('agencyLine');
    line.hidden = !agencyName;
    line.textContent = agencyName ? `Riding ${agencyName}` : '';

    const a = result.annual;
    $('statMiles').textContent = core.number(a.miles);
    $('statGallons').textContent = core.number(a.gallons);
    $('statDollars').textContent = core.money(a.dollars);
    $('statTrees').textContent = core.number(a.treeSeedlings);
    $('equiv').textContent = a.savedLbs > 0
      ? `Put another way: the CO₂ you avoid each year equals charging a smartphone about ${core.number(a.phoneCharges)} times, or what ${core.number(a.treeSeedlings)} city tree seedlings take up in 10 years of growing (EPA equivalencies).`
      : '';

    const max = Math.max(a.carLbs, a.rideLbs, 1);
    $('barRide').style.width = `${Math.max((a.rideLbs / max) * 100, a.rideLbs > 0 ? 1 : 0)}%`;
    $('barCar').style.width = `${(a.carLbs / max) * 100}%`;
    $('barRideValue').textContent = core.lbs(a.rideLbs);
    $('barCarValue').textContent = core.lbs(a.carLbs);
  }

  function onSubmit(ev) {
    ev.preventDefault();
    clearErrors();
    const check = core.validate(readForm(), data);
    if (!check.ok) return showErrors(check.errors);
    const agency = data.agencies.find(x => x.id === $('agency').value);
    const agencyName = agency && agency.id !== 'other_pa' && agency.id !== 'outside' ? agency.name : '';
    const result = core.calculate(check.values, data);
    last = { values: check.values, result, agencyName };
    render(result, agencyName);
    $('shareStatus').textContent = '';
    $('postFallback').hidden = true;
    const results = $('results');
    results.hidden = false;
    $('details').hidden = false;
    results.classList.remove('is-new');
    void results.offsetWidth; // restart the line animation
    results.classList.add('is-new');
    const title = $('resultsTitle');
    title.focus({ preventScroll: true });
    title.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function onYears() {
    const y = Number($('years').value);
    $('yearsOut').textContent = y;
    $('years').setAttribute('aria-valuetext', `${y} ${y === 1 ? 'year' : 'years'}`);
    if (!last) return;
    last.values.years = y;
    last.result = core.calculate(last.values, data);
    render(last.result, last.agencyName);
  }

  // ── Sharing ──
  function say(msg) {
    const el = $('shareStatus');
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 50); // re-announce even if the text repeats
  }

  async function copyPost() {
    if (!last) return;
    const text = core.sharePost(last.result, data, last.agencyName);
    try {
      await navigator.clipboard.writeText(text);
      say('Post copied. Paste it into LinkedIn, Instagram, or wherever you post.');
      $('postFallback').hidden = true;
    } catch (e) {
      const box = $('postText');
      box.value = text;
      $('postFallback').hidden = false;
      box.focus();
      box.select();
      say("Your browser blocked copying, so the post is in the box below. It's already selected.");
    }
  }

  function drawCard() {
    const c = $('cardCanvas');
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const a = last.result.annual;
    const sign = "800 {s}px Overpass, 'Arial Narrow', sans-serif";
    const body = "{w} {s}px 'Atkinson Hyperlegible Next', 'Segoe UI', sans-serif";
    const font = (tpl, s, w = 400) => tpl.replace('{s}', s).replace('{w}', w);
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ink').trim(), yellow = css.getPropertyValue('--yellow').trim(), soft = css.getPropertyValue('--on-ink-soft').trim();

    g.fillStyle = ink; g.fillRect(0, 0, W, H);
    // tactile strip
    g.fillStyle = yellow; g.fillRect(0, 0, W, 36);
    g.fillStyle = 'rgba(18,38,63,0.38)';
    for (let x = 12; x < W; x += 24) for (let y = 9; y < 36; y += 18) { g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill(); }

    g.fillStyle = yellow; g.font = font(sign, 30); g.textBaseline = 'alphabetic';
    g.fillText('TRANSIT CARBON CALCULATOR', 80, 130);
    g.fillStyle = '#ffffff'; g.font = font(sign, 92);
    const top = core.savedParts(a.savedLbs);
    g.fillText(`${top.value} lbs`, 80, 270);
    g.font = font(body, 44, 700);
    g.fillText(a.savedLbs >= 0 ? 'of CO₂ kept out of the air each year' : 'more CO₂ a year than this efficient car', 80, 335);
    g.fillStyle = soft; g.font = font(body, 36);
    g.fillText(`by ${core.going(last.result.mode)} instead of driving${last.agencyName ? ',' : '.'}`, 80, 395);
    if (last.agencyName) g.fillText(`on ${last.agencyName}.`, 80, 440);

    // the line
    const y0 = 600, x0 = 140, x1 = W - 140;
    g.fillStyle = yellow; g.fillRect(x0, y0 - 9, x1 - x0, 18);
    const stops = [['1 WEEK', last.result.week], ['1 MONTH', last.result.month], ['1 YEAR', a], [`${last.result.years} YEARS`, last.result.span]];
    stops.forEach(([label, p], i) => {
      const x = x0 + (i * (x1 - x0)) / 3;
      const end = i === 3;
      g.beginPath(); g.arc(x, y0, 30, 0, Math.PI * 2); g.fillStyle = end ? yellow : '#ffffff'; g.fill();
      g.lineWidth = 11; g.strokeStyle = end ? '#ffffff' : yellow; g.stroke();
      g.textAlign = 'center';
      g.fillStyle = end ? yellow : soft; g.font = font(sign, 26); g.fillText(label, x, y0 - 58);
      g.fillStyle = '#ffffff'; g.font = font(sign, 40); g.fillText(core.savedParts(p.savedLbs).value, x, y0 + 90);
      g.fillStyle = soft; g.font = font(body, 24); g.fillText(p.savedLbs >= 0 ? 'lbs CO₂ avoided' : 'lbs CO₂ more', x, y0 + 124);
      g.textAlign = 'left';
    });

    g.fillStyle = '#ffffff'; g.font = font(body, 34, 700);
    g.fillText(`${core.number(a.miles)} car miles skipped`, 80, 850);
    g.fillText(`${core.money(a.dollars)} in gas money kept`, 80, 900);
    g.fillStyle = soft; g.font = font(body, 26);
    g.fillText('EPA emission factors. Find your number:', 80, 990);
    g.fillStyle = yellow; g.font = font(body, 28, 700);
    g.fillText('meyeringn.github.io/transit-carbon-calculator', 80, 1030);
  }

  async function downloadCard() {
    if (!last) return;
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all([document.fonts.load("800 40px Overpass"), document.fonts.load("700 40px 'Atkinson Hyperlegible Next'")]);
      }
      drawCard();
      const link = document.createElement('a');
      link.download = 'my-transit-carbon-savings.png';
      link.href = $('cardCanvas').toDataURL('image/png');
      document.body.append(link);
      link.click();
      link.remove();
      say(`Image downloaded. Alt text you can paste with it: ${core.imageAltText(last.result, data, last.agencyName)}`);
    } catch (e) {
      say("Couldn't make the image in this browser. A screenshot of your results works too.");
    }
  }

  function startOver() {
    last = null;
    $('calc').reset();
    if (livePrice) $('gasPrice').value = livePrice;
    $('years').value = 10;
    onYears();
    clearErrors();
    $('results').hidden = true;
    $('details').hidden = true;
    $('shareStatus').textContent = '';
    $('postFallback').hidden = true;
    document.querySelector('input[name=mode]').focus();
  }

  // ── Wire up ──
  applyDefaults();
  buildModes();
  buildAgencies();
  buildMethod();
  loadGasPrice();
  $('calc').addEventListener('submit', onSubmit);
  $('years').addEventListener('input', onYears);
  $('copyPost').addEventListener('click', copyPost);
  $('downloadCard').addEventListener('click', downloadCard);
  $('startOver').addEventListener('click', startOver);
})();
