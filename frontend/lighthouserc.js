// Lighthouse CI Configuration
// Run with: npx lhci autorun
// Install: npm install --save-dev @lhci/cli

module.exports = {
  ci: {
    collect: {
      // Static build (run `npm run build` first)
      staticDistDir: './dist',
      // OR use local server
      // url: ['http://localhost:3000/', 'http://localhost:3000/menu'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],

        // Accessibility
        'color-contrast': 'warn',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
      },
    },
    upload: {
      // Temporarily store reports locally
      target: 'temporary-public-storage',
    },
  },
};
