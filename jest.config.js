/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  setupFilesAfterEnv: ['<rootDir>/src/utility/test/customMatcher.ts'],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};