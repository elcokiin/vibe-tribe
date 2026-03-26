const expoPreset = require("jest-expo/jest-preset");

const setupFiles = (expoPreset.setupFiles || []).filter(
  (file) => !file.includes("react-native/jest/setup.js"),
);

/** @type {import('jest').Config} */
module.exports = {
  ...expoPreset,
  setupFiles: ["<rootDir>/jest.globals.js", ...setupFiles],
  transformIgnorePatterns: [
    "/node_modules/(?!(\\.bun|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@rn-primitives))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "<rootDir>/tests/**/*.test.tsx",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "contexts/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "!app/_layout.tsx",
    "!**/*.d.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/.expo/", "/assets/"],
  clearMocks: true,
  testEnvironmentOptions: {
    customExportConditions: ["react-native"],
  },
};
