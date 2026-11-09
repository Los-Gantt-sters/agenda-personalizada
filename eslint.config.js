const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");
const jsxA11y = require("eslint-plugin-jsx-a11y");

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },
  {
    ignores: ["node_modules/**", ".expo/**", "android/**", "ios/**", "dist/**"],
  },
];
