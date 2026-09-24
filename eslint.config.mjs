import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // All logging goes through createLogger() in src/lib/logger.ts.
      "no-console": "error",
    },
  },
  {
    // The logger is the one place allowed to write to the console (its test spies on it).
    // CLI scripts write to stdout/stderr directly.
    files: ["src/lib/logger.ts", "tests/unit/logger.test.ts", "scripts/**"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
