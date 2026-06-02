
const emissionFactors = {
car: 0.89,
bus: 0.18,
rail: 0.12,
subway: 0.10,
bike: 0.0,
walk: 0.0
};

const LBS_PER_TREE = 48;

// Store raw annual values for timeframe toggling
let annualData = null;

function animateNumber(elementId, target, prefix = '', suffix = '') {
const el = document.getElementById(elementId);
const duration = 1000;
const start = performance.now();

function update(now) {
const elapsed = now - start;
const progress = Math.min(elapsed / duration, 1);
const eased = 1 - Math.pow(1 - progress, 3);
const current = Math.round(target * eased);
el.textContent = prefix + current.toLocaleString() + suffix;
if (progress < 1) requestAnimationFrame(update);
}
requestAnimationFrame(update);
}

function calculate() {
const miles = parseFloat(document.getElementById('miles').value);
const days = parseInt(document.getElementById('days').value);
const mode = document.getElementById('mode').value;
const gasCost = parseFloat(document.getElementById('gasCost').value) || 3.50;
const mpg = parseFloat(document.getElementById('mpg').value) || 28;

if (!miles || !days || miles <= 0 || days <= 0) {
alert('Please enter your commute distance and days per week.');
return;
}

const weeksPerYear = 50;
const annualMiles = miles * 2 * days * weeksPerYear;
const carEmissions = annualMiles * emissionFactors.car;
const transitEmissions = annualMiles * emissionFactors[mode];
const co2Saved = Math.round(carEmissions - transitEmissions);
const treesEquiv = Math.round(co2Saved / LBS_PER_TREE);
const moneySaved = Math.round((annualMiles / mpg) * gasCost);

const pctReduction = carEmissions > 0
? Math.round(((carEmissions - transitEmissions) / carEmissions) * 100)
: 100;

// Save annual values globally for toggle
annualData = {
co2Saved,
miles: Math.round(annualMiles),
trees: treesEquiv,
money: moneySaved,
pct: pctReduction,
mode
};

// Show results
const resultsEl = document.getElementById('results');
resultsEl.style.display = 'block';
resultsEl.scrollIntoView({ behavior: 'smooth' });

// Reset toggle to Annual
document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
document.querySelectorAll('.toggle-btn')[0].classList.add('active');

// Animate gauge
setTimeout(() => {
document.getElementById('gaugeFill').style.width = pctReduction + '%';
document.getElementById('gaugePct').textContent =
pctReduction + '% fewer emissions than driving alone';
}, 100);

// Animate stats
renderStats(annualData, 'annual');
document.getElementById('contextMsg').textContent =
getContextMessage(co2Saved, mode);
}

function renderStats(data, timeframe) {
let divisor = 1;
if (timeframe === 'monthly') divisor = 12;
if (timeframe === 'weekly') divisor = 50;

animateNumber('co2Saved', Math.round(data.co2Saved / divisor), '', ' lbs');
animateNumber('milesAvoided', Math.round(data.miles / divisor), '', '');
animateNumber('treesEquiv', Math.round(data.trees / divisor), '', '');
animateNumber('moneySaved', Math.round(data.money / divisor), '$', '');
}

function setTimeframe(timeframe, btn) {
if (!annualData) return;
document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
renderStats(annualData, timeframe);
}

function getContextMessage(co2Saved, mode) {
if (mode === 'bike' || mode === 'walk') {
return "🌱 Zero emissions — you're as clean as it gets. Philly thanks you.";
}
if (co2Saved > 5000) {
return "🏆 That's a massive impact. You're saving more carbon than most Philadelphians by a wide margin. Share this.";
}
if (co2Saved > 2000) {
return "🚌 Solid. Your transit habit is doing real work — equivalent to planting a small urban grove every year.";
}
if (co2Saved > 500) {
return "✅ Every trip counts. Your commute choices are making a measurable difference for Philadelphia's air quality.";
}
return "🌿 Even small shifts add up. Every car trip you skip is a win for the city.";
}
