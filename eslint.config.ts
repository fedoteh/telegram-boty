import globals from "globals";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}", "**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir,
      },
    },
    rules: {
      "no-console": "off",
    },
  },
]);
