/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  // Playwright specs live in e2e/ and are run with `npm run test:e2e`, not Jest
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/utility/test/customMatcher.ts'],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};
