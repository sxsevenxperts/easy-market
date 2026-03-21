/**
 * Jest Configuration — Easy Market Backend
 */

'use strict';

module.exports = {
  // Run tests in a Node.js environment (not jsdom)
  testEnvironment: 'node',

  // Run setup file after the test framework is installed in the environment
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Collect coverage from all source files, excluding migrations
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeds/**',
    '!src/scripts/**',
    '!src/debug-env.js',
  ],

  // Only match files inside the tests directory
  testMatch: ['**/tests/**/*.test.js'],

  // Show individual test names while running
  verbose: true,

  // Fail fast — stop after first test suite failure (optional; remove to see all failures)
  // bail: 1,

  // Timeout per test (ms)
  testTimeout: 10000,

  // Clear mock calls and instances between every test
  clearMocks: true,

  // Restore mocked implementations between tests
  restoreMocks: false,

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Minimum coverage thresholds (adjust as suite matures)
  coverageThreshold: {
    global: {
      branches:   50,
      functions:  60,
      lines:      60,
      statements: 60,
    },
  },
};
