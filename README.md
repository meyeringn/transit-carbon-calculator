# Transit Carbon Calculator

**How much carbon does my ride save?** A free, private calculator that turns a daily bus, trolley, subway, or train commute into real numbers: pounds of CO₂ avoided, car miles skipped, gallons of gas not burned, and gas money kept, by the week, month, year, and as many years as you keep riding.

**Live tool:** https://meyeringn.github.io/transit-carbon-calculator/

A [Transit 4 All PA](https://transit4allpa.org) tool, built by [Nico Meyering](https://github.com/meyeringn).

**Data last verified:** November 2026

---

## Why it exists

Transit riders, advocates, and agencies make the climate case for public transit all the time, usually without a number to point to. This tool gives every rider their own number in about a minute, plus a ready-to-paste post and a shareable image with alt text.

It matters most for the people who ride because they have to: Disabled riders, people who don't drive, and households without a car. Their trips are already climate action. This makes that visible.

## Who it serves

- **Riders** who want to know their personal climate impact
- **Advocates** making the case for transit funding, with a concrete, sourced figure
- **Transit agencies** looking for a no-cost engagement tool

## Coverage

Riders can name any of 11 transit agencies serving Pennsylvania riders, so it appears on their results and share image: SEPTA, PATCO, Pittsburgh Regional Transit (PRT), CATA, rabbittransit, rabbittransit Capital Region (formerly Capital Area Transit), Red Rose Transit, COLTS, LANTA, BARTA, and EMTA. Riders elsewhere can choose "Another Pennsylvania system" or "Outside Pennsylvania."

The math uses **national EPA averages for each mode**, the same for every agency. Agency-specific factors are on the roadmap below.

## Methodology

This is an estimate for public education, not certified emissions accounting. The page shows every step under "How we calculate."

1. **Yearly miles** = one-way miles × 2 × days per week × 50 weeks
2. **Car CO₂** = yearly miles ÷ mpg × 19.59 lbs CO₂ per gallon (8,887 g, from [EPA](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle)). The default is 22.8 mpg, the 2022 average EPA uses in its equivalencies.
3. **Your ride's CO₂** = yearly miles × the passenger-mile factor below
4. **CO₂ avoided** = car CO₂ minus your ride's CO₂. If a very efficient car would beat the average for your mode, the page says so instead of hiding it.
5. **Gas money** = yearly miles ÷ mpg × gas price. The price loads live from the [EIA](https://www.eia.gov/petroleum/gasdiesel/) weekly Central Atlantic average, and riders can edit it.

| Mode | kg CO₂e per passenger-mile | Source |
| --- | --- | --- |
| Bus or trackless trolley | 0.0666 | [EPA GHG Emission Factors Hub (2025), Table 10](https://www.epa.gov/climateleadership/ghg-emission-factors-hub) |
| Subway, El, trolley, or light rail | 0.0935 | same, "transit rail" |
| Regional Rail or commuter rail | 0.134 | same, "commuter rail" |
| Bike, walk, or roll | 0 | no tailpipe |

Equivalencies come from [EPA's Greenhouse Gas Equivalencies Calculator](https://www.epa.gov/energy/greenhouse-gases-equivalencies-calculator-calculations-and-references): 0.060 metric tons of CO₂ per urban tree seedling grown for 10 years, and 1.24 × 10⁻⁵ metric tons per smartphone charge.

**What it leaves out:** transit factors are national averages, so a full bus or a line on a clean grid does better than shown and a nearly empty one does worse. Car figures count only the tailpipe, not making the car or refining the fuel. Electric cars, carpools, and fares aren't modeled yet.

Every number lives in [`js/data.js`](js/data.js) with its source, and `npm test` fails if this README falls out of step with it.

## Privacy

Nothing you type leaves your browser. Inputs are never stored, logged, or put in a URL. Fonts, styles, and the calculator's code load from this site. The page contacts two outside services: the EIA API at api.eia.gov (for the gas price) and [GoatCounter](https://www.goatcounter.com/), whose counting script loads from gc.zgo.at and which counts visits without cookies, recording the page path only.

## Accessibility

Built to WCAG 2.2 AA, with Disabled riders as the primary users. See the [accessibility statement](ACCESSIBILITY.md) for what's been tested and what's still open.

## Tech

Plain HTML, CSS, and JavaScript. No framework, no build step, no account. Opening `index.html` straight from disk works.

```
index.html          markup only
css/styles.css      design tokens at the top (see docs/DESIGN.md)
js/data.js          every factor, source, agency, and date
js/core.js          pure math and wording, unit-tested in Node
js/app.js           DOM, live gas price, sharing
tests/              unit tests and an offline browser smoke test
scripts/check.mjs   static checks: CSP, contrast, copy rules, README sync
```

## Development

```
npm test                         # unit tests + static checks (no install needed)
npm run serve                    # http://localhost:8000
npm i && npx playwright install chromium
SCREENSHOTS=shots npm run test:e2e   # offline browser test, 390px and 1280px screenshots
```

This project is built with Claude. [docs/working-with-claude.md](docs/working-with-claude.md) explains the workflow that keeps it trustworthy, and [CLAUDE.md](CLAUDE.md) holds the project rules.

## Roadmap

- **Agency-specific factors** from FTA's National Transit Database (energy use and passenger-miles by agency and mode)
- **A Philadelphia map rebuilt on real data** (Census ACS commute mode share). The earlier map was removed in v2.0 because its numbers had no source.
- **Spanish**, reviewed by a native speaker
- Electric car and carpool comparisons

## Contributing

Spot an outdated factor or want something added? [Open an issue](https://github.com/meyeringn/transit-carbon-calculator/issues) with a link to the source.

## License

[MIT](LICENSE). Fonts: Atkinson Hyperlegible Next and Overpass, both under the [SIL Open Font License](fonts/).
