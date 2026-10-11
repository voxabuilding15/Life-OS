/** Integration suite: real PostgreSQL + the project's migrations behind a Supabase-compatible shim. `npm run test:integration` */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/integration/*.itest.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/integration/globalSetup.mjs',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.mjs',
  testTimeout: 30000,
};
