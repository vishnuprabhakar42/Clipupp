// Homepage performance budgets, asserted against a production build with the
// demo feed (see .github/workflows/lighthouse-ci.yml). Mobile emulation.
module.exports = {
  ci: {
    collect: { url: ["http://localhost:3000/", "http://localhost:3000/hi"], numberOfRuns: 3, settings: { preset: "perf", formFactor: "mobile", screenEmulation: { mobile: true } } },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        // Target 200. Ratchet at the 2026-10-14 measurement plus 200 (best of 3: 304 on /, 410 on /hi)
        // until the hydration cost of the shared chunks comes down; lower it as that work lands.
        "total-blocking-time": ["error", { maxNumericValue: 610 }],
        // Target 170000. Ratchet at the 2026-10-14 measurement (225684 bytes on the wire, including the
        // idle-loaded toaster and lazy islands) plus about 2%, so any new script fails the budget.
        "resource-summary:script:size": ["error", { maxNumericValue: 230000 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
