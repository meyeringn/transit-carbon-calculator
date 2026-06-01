// EPA & APTA emission factors (lbs CO2 per passenger mile)
const emissionFactors = {
car: 0.89, // average single-occupancy vehicle
bus: 0.18, // transit bus (APTA avg)
rail: 0.12, // commuter rail
subway: 0.10, // heavy rail / subway
bike: 0.0,
walk: 0.0
};

// 1 tree absorbs ~48 lbs CO2/year (EPA estimate)
const LBS_PER_TREE = 48;

function calculate() {
const miles = parseFloat(document.getElementById('miles').value);
const days = parseInt(document.getElementById('days').value);
const mode = document.getElementById('mode').value;

// Basic validation
if (!miles || !days || miles <= 0 || days <= 0) {
alert('Please enter your commute distance and days per week.');
return;
}

const weeksPerYear = 50; // accounts for vacation/holidays
const annualMiles = miles * 2 * days * weeksPerYear; // round trip

const carEmissions = annualMiles * emissionFactors.car;
const transitEmissions = annualMiles * emissionFactors[mode];
const co2Saved = Math.round(carEmissions - transitEmissions);
const treesEquiv = Math.round(co2Saved / LBS_PER_TREE);

// Display results
document.getElementById('co2Saved').textContent = co2Saved.toLocaleString() + ' lbs';
document.getElementById('milesAvoided').textContent = Math.round(annualMiles).toLocaleString();
document.getElementById('treesEquiv').textContent = treesEquiv.toLocaleString();

// Contextual message
const msg = getContextMessage(co2Saved, mode);
document.getElementById('contextMsg').textContent = msg;

document.getElementById('results').style.display = 'block';
document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function getContextMessage(co2Saved, mode) {
if (mode === 'bike' || mode === 'walk') {
return "🌱 Zero emissions — you're as clean as it gets. Philly thanks you.";
}
if (co2Saved > 5000) {
return `🏆 That's an enormous impact. You're saving more carbon than most Philadelphians by a wide margin. Share this.`;
}
if (co2Saved > 2000) {
return `🚌 Solid. Your transit habit is doing real work — equivalent to planting a small urban grove every year.`;
}
if (co2Saved > 500) {
return `✅ Every trip counts. Your commute choices are making a measurable difference for Philadelphia's air quality.`;
}
return `🌿 Even small shifts add up. Every car trip you skip is a win for the city.`;
}
