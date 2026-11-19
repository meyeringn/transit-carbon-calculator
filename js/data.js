// Every number the calculator uses, with its source. Nothing else in the
// project may hard-code an emission factor, a conversion, or a date.
// To refresh after a new EPA release, use the update-factors skill
// (.claude/skills/update-factors/SKILL.md), then run `npm test`.
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else (root.TCC = root.TCC || {}).data = data;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  return {
    version: '2.0.0',
    verified: 'November 2026',
    verifiedISO: '2026-11-19',
    siteUrl: 'https://meyeringn.github.io/transit-carbon-calculator/',

    // Calendar: 50 commuting weeks a year leaves room for holidays and time off.
    weeksPerYear: 50,
    monthsPerYear: 12,

    // Unit conversion (exact definition: 1 lb = 0.45359237 kg).
    lbsPerKg: 2.20462262,

    // Driving: tailpipe CO2 from burning one gallon of gasoline.
    gasoline: {
      gramsCO2PerGallon: 8887,
      source: 'epaVehicle',
    },

    // The car you would otherwise drive. 22.8 mpg is the 2022 weighted average
    // for cars and light trucks that EPA uses in its equivalencies.
    defaultMpg: 22.8,
    defaultMpgSource: 'epaEquivalencies',

    // Used only if the live EIA price can't load. The rider can always edit it.
    defaultGasPrice: 3.5,

    // Transit: kg CO2e per passenger-mile, national averages.
    // EPA GHG Emission Factors Hub (2025), Table 10.
    modes: {
      bus: {
        label: 'Bus or trackless trolley',
        hint: 'City and suburban buses, trackless trolleys',
        short: 'bus',
        kgCO2ePerPassengerMile: 0.0666,
        source: 'epaHub',
      },
      rail: {
        label: 'Subway, El, trolley, or light rail',
        hint: "Like SEPTA's L, B, or trolleys, PATCO, or PRT's T",
        short: 'rail transit',
        kgCO2ePerPassengerMile: 0.0935,
        source: 'epaHub',
      },
      commuter: {
        label: 'Regional Rail or commuter rail',
        hint: 'Like SEPTA Regional Rail',
        short: 'commuter rail',
        kgCO2ePerPassengerMile: 0.134,
        source: 'epaHub',
      },
      bike: {
        label: 'Bike or scooter',
        hint: 'No tailpipe at all',
        short: 'bike',
        kgCO2ePerPassengerMile: 0,
        source: null,
      },
      walk: {
        label: 'Walk or roll',
        hint: 'On foot, in a wheelchair, or with a mobility device',
        short: 'walking or rolling',
        kgCO2ePerPassengerMile: 0,
        source: null,
      },
    },

    // EPA Greenhouse Gas Equivalencies: carbon taken up by one urban tree
    // seedling grown for 10 years, and CO2 from one smartphone charge.
    equivalencies: {
      metricTonsPerTreeSeedling10yr: 0.060,
      metricTonsPerSmartphoneCharge: 0.0000124,
      source: 'epaEquivalencies',
    },

    // Agencies are context today: results use the national factors above.
    // Agency-specific factors from FTA's National Transit Database are planned.
    agencies: [
      { id: 'septa', group: 'Southeast', name: 'SEPTA', area: 'Philadelphia and Bucks, Chester, Delaware, and Montgomery counties' },
      { id: 'patco', group: 'Southeast', name: 'PATCO Speedline', area: 'Philadelphia and South Jersey' },
      { id: 'prt', group: 'Southwest', name: 'Pittsburgh Regional Transit (PRT)', area: 'Pittsburgh and Allegheny County. Formerly Port Authority of Allegheny County' },
      { id: 'cata', group: 'Central', name: 'CATA', area: 'State College and Centre County' },
      { id: 'rabbittransit', group: 'Central', name: 'rabbittransit', area: 'York, Adams, and other south-central and central counties' },
      { id: 'capital', group: 'Central', name: 'rabbittransit Capital Region', area: 'Harrisburg area. Formerly Capital Area Transit (CAT)' },
      { id: 'rrta', group: 'Central', name: 'Red Rose Transit', area: 'Lancaster County' },
      { id: 'colts', group: 'Northeast', name: 'COLTS', area: 'Scranton and Lackawanna County' },
      { id: 'lanta', group: 'Northeast', name: 'LANTA', area: 'Lehigh Valley: Allentown, Bethlehem, Easton' },
      { id: 'barta', group: 'Northeast', name: 'BARTA', area: 'Reading and Berks County' },
      { id: 'emta', group: 'Northwest', name: 'EMTA', area: 'Erie County' },
      { id: 'other_pa', group: 'Other', name: 'Another Pennsylvania system', area: 'Pennsylvania' },
      { id: 'outside', group: 'Other', name: 'Outside Pennsylvania', area: 'Outside Pennsylvania' },
    ],

    // Live gas price: EIA weekly retail regular gasoline, Central Atlantic (PADD 1B),
    // the region that includes Pennsylvania.
    gasPriceApi: {
      url: 'https://api.eia.gov/v2/petroleum/pri/gnd/data/?frequency=weekly&data[0]=value&facets[series][]=EMM_EPMR_PTE_R1Z_DPG&sort[0][column]=period&sort[0][direction]=desc&length=1&api_key=DEMO_KEY',
      region: 'Central Atlantic',
      timeoutMs: 6000,
      source: 'eia',
    },

    sources: {
      epaHub: {
        name: 'EPA GHG Emission Factors Hub (2025), Table 10',
        url: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub',
      },
      epaVehicle: {
        name: 'EPA, Greenhouse Gas Emissions from a Typical Passenger Vehicle',
        url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
      },
      epaEquivalencies: {
        name: 'EPA Greenhouse Gas Equivalencies Calculator: Calculations and References',
        url: 'https://www.epa.gov/energy/greenhouse-gases-equivalencies-calculator-calculations-and-references',
      },
      eia: {
        name: 'U.S. Energy Information Administration, Gasoline and Diesel Fuel Update',
        url: 'https://www.eia.gov/petroleum/gasdiesel/',
      },
    },
  };
});
