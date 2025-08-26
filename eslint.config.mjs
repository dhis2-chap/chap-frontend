import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      "**/.d2/**",
      "dist/**",
      ".turbo/**",
      ".eslintcache/**",
      "**/ui/src/httpfunctions/**",
      "**/*.{js,jsx}"
    ]
  },
  { files: ["packages/**/*.{ts,tsx,mts,cts}"], languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: config.files ? config.files.map(fileGlob => `packages/${fileGlob}`) : ["packages/**/*.{ts,tsx,mts,cts}"],
  })),
  {
    files: ["packages/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    }
  },
  {
    files: ["packages/**/*.{ts,tsx}"],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "18.3.1"
      }
    }
  },
]);
