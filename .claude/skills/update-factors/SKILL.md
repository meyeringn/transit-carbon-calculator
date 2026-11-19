---
name: update-factors
description: Refresh the calculator's emission factors, equivalencies, agency names, or "data last verified" date from their published sources. Use when EPA releases a new Emission Factors Hub or equivalencies update, or when an agency changes its name.
---
# Update factors

1. Open each source listed in `js/data.js` → `sources` and read the current value yourself. Don't rely on memory, a search snippet, or a third-party copy unless the official page is unreachable; if you use a copy, say which one in the PR.
   - Transit: EPA GHG Emission Factors Hub, Table 10 (bus, transit rail, commuter rail), kg CO2e per passenger-mile.
   - Driving: EPA typical passenger vehicle page (grams CO2 per gallon of gasoline).
   - Equivalencies: EPA Calculations and References (tree seedling grown 10 years, smartphone charge).
   - Agencies: each agency's own website for its current public name.
2. Edit only `js/data.js`. Keep published precision (don't round 0.0935 to 0.09).
3. Update `verified` and `verifiedISO` in `js/data.js`, the "Data last verified" line in `README.md`, the factor table in the README Methodology section, and the fixed values in `tests/core.test.js` ("factors match their published sources"), then update the worked example's expected numbers.
4. Run `npm test` and `npm run test:e2e`. The smoke test has expected numbers too; update them only after you've checked the new math by hand.
5. Bump the patch version in `js/data.js` and `package.json`.
6. Open a PR that lists each old value, new value, and the URL you read it from.
