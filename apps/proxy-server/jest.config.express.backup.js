/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/", "<rootDir>/tests/"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts", // エントリーポイントは除外
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  verbose: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 10000, // デフォルトのタイムアウト設定
};
