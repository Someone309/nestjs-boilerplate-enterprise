/**
 * E2E Test Setup
 *
 * Global setup for end-to-end tests.
 */

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_CONSOLE === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
