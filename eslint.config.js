import js from "@eslint/js";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    plugins: {
      react: react,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: Object.assign({}, react.configs.recommended.rules, jsxA11y.configs.recommended.rules, {
      "react/react-in-jsx-scope": "off",
    }),
  },
  prettierConfig,
  {
    ignores: ["node_modules/**", "dist/**", "build/**"],
  },
];
