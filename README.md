# 🚌 Transit Carbon Calculator

**How much carbon does my ride save?** A free, browser-based calculator that turns a daily bus, trolley, subway, or train commute into real numbers: pounds of CO₂ avoided, car miles skipped, gas money saved, and trees' worth of carbon, by the week, month, year, and decade.

🌐 **Live tool:** https://meyeringn.github.io/transit-carbon-calculator/

A [Transit 4 All PA](https://transit4allpa.org) tool, built by [Nico Meyering](https://github.com/meyeringn).

**Data last verified:** November 2026

---

## Why it exists

Transit riders, advocates, and agencies make the climate case for public transit all the time, usually without a number to point to. This tool gives every rider their own number, in under a minute, and a shareable card to post it.

It matters most for the people who ride because they have to: Disabled riders, people who don't drive, and households without a car. Their trips are already climate action. This makes that visible.

## Who it serves

- **Riders** who want to know their personal climate impact
- **Advocates** making the case for transit funding, with a concrete, shareable figure
- **Transit agencies** looking for a no-cost engagement tool for riders

## Coverage

Agency-specific estimates for 11 transit agencies serving Pennsylvania riders:

| Agency | Region |
| --- | --- |
| SEPTA | Southeastern Pennsylvania |
| PATCO | Philadelphia / South Jersey |
| Port Authority of Allegheny County | Pittsburgh |
| CATA | State College |
| rabbittransit | York / Adams counties |
| Red Rose Transit Authority | Lancaster |
| Capital Area Transit | Harrisburg |
| COLTS | Scranton |
| LANTA | Allentown / Lehigh Valley |
| BARTA | Reading |
| EMTA | Erie |

Riders elsewhere in Pennsylvania get statewide average factors, and out-of-state riders get national averages.

## Features

- Bus, subway or rail, commuter rail, bike, and walking modes
- Weekly, monthly, and annual results, plus a 10-year lifetime projection
- Comparison against the average Pennsylvania commuter and a solo car trip of the same distance
- Current gas prices from the U.S. Energy Information Administration
- An optional Philadelphia neighborhood map pin
- A downloadable share card and a LinkedIn share button

## Methodology

- **Emissions factors:** EPA greenhouse gas emission factors for driving, and APTA research on transit emissions per passenger mile
- **Gas prices:** U.S. Energy Information Administration weekly retail gasoline prices, loaded live when available
- **Comparison baseline:** about 3,400 lbs of CO₂ per year for the average Pennsylvania commuter (EPA and PennDOT data)
- **Calendar:** 50 commuting weeks per year

All results are estimates for public education, not certified emissions accounting. Actual savings depend on vehicle, ridership, route, and time of day.

## Tech

One `index.html` file with plain HTML, CSS, and JavaScript. No framework, no build step, no account, and no tracking of your inputs (page visits are counted anonymously with GoatCounter). Open it anywhere, or fork it for your own region.

## Contributing

Spot an outdated factor or want your agency added? [Open an issue](https://github.com/meyeringn/transit-carbon-calculator/issues) with the agency name and a source.

## License

[MIT](LICENSE). Free to use, adapt, and share.
