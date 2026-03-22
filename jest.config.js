module.exports = {
  preset:              'ts-jest',
  testEnvironment:     'node',
  roots:               ['<rootDir>/src'],
  testMatch:           ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/cli/**'],
  coverageThreshold:   { global: { lines: 60 } },
  globals: {
    'ts-jest': { tsconfig: { strict: false } }
  }
};
