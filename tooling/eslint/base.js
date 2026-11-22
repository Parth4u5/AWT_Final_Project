const tseslint = require("typescript-eslint");
const reactHooks = require("eslint-plugin-react-hooks");
// v0.5+ wraps the plugin in `default`; older releases expose it directly.
const reactRefreshModule = require("eslint-plugin-react-refresh");
const reactRefresh = reactRefreshModule.default ?? reactRefreshModule;
const jsxA11y = require("eslint-plugin-jsx-a11y");
const importX = require("eslint-plugin-import-x");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

/** @type {import('eslint').Linter.Config[]} */
module.exports = tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      // Config files use CommonJS require by design; app source is linted elsewhere.
      "tooling/**",
    ],
  },
  tseslint.configs.eslintRecommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: {
      "import-x": importX,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "import-x/no-duplicates": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // Phase 1 is a no-behaviour-change migration: these pre-existing legacy
      // patterns are addressed in Phase 3's accessibility UI work.
      "react-hooks/set-state-in-effect": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  // Must be last: disables formatting rules that conflict with Prettier.
  eslintConfigPrettier,
);
