import nextConfig from "eslint-config-next";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import readableTailwind from "eslint-plugin-readable-tailwind";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  ...nextConfig,
  prettierRecommended,
  {
    ignores: ["src/generated/**"],
  },
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
      "readable-tailwind": readableTailwind,
    },
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "react/no-unescaped-entities": 0,
      "readable-tailwind/multiline": [
        "warn",
        {
          preferSingleLine: true,
          printWidth: 100,
        },
      ],
    },
  },
];
