module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/coverage/"],
  testTimeout: 60000, // 60 seconds timeout for video generation tests
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  preset: "ts-jest/presets/default",
};
