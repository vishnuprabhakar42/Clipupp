module.exports = {
  ci: {
    collect: { url: ["http://localhost:3000/", "http://localhost:3000/hi"], numberOfRuns: 3, settings: { preset: "perf", formFactor: "mobile", screenEmulation: { mobile: true } } },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 170000 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
