// Homepage budgets (performance, plus the SEO, accessibility and best-practices
// gates), asserted against a production build with the demo feed (see
// .github/workflows/lighthouse-ci.yml). Mobile emulation.
//
// Only / and /hi are collected: the demo feed fills the homepage without a
// backend, while /stores, /coupons, /categories and /blog need the Spring API,
// which the CI job does not run. Those routes lost Lighthouse coverage here by
// decision, not by accident; add them back once CI starts a backend.
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/", "http://localhost:3000/hi"],
      numberOfRuns: 3,
      settings: {
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        formFactor: "mobile",
        screenEmulation: { mobile: true },
      },
    },
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
        "categories:seo": ["error", { minScore: 1 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.95 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
