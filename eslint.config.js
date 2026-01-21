import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".agents/**", "node_modules", "tailwind.config.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn", // Existing code has some any types
      // Accessibility rules - warn initially to avoid breaking build
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/media-has-caption": "warn", // User-uploaded content may not have captions
      "jsx-a11y/heading-has-content": "warn", // Some shadcn components use dynamic content
      "jsx-a11y/anchor-has-content": "warn", // Some shadcn components use dynamic content
      "jsx-a11y/no-autofocus": "warn", // Autofocus improves UX in modal dialogs
      "@typescript-eslint/no-empty-object-type": "warn", // Some shadcn types use empty interfaces
      "prefer-const": "warn",
    },
  },
);
