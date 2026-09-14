import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next/core-web-vitals";

const TYPED_SOURCES = ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts"];

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  js.configs.recommended,
  ...nextConfig,

  // Type-aware linting applies to project source only. Configuration files are
  // outside the TypeScript project and would otherwise fail to resolve.
  {
    files: TYPED_SOURCES,
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },

  // Environment variables are read only inside src/config (CODEBASE-RULES 3).
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/config/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env']",
          message:
            "Read environment variables only through src/config (CODEBASE-RULES 3).",
        },
      ],
    },
  },

  // Domain imports nothing outside domain (CODEBASE-RULES 4).
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "next",
                "next/*",
                "zod",
                "server-only",
                "@/server/*",
                "@/integrations/*",
                "@/config/*",
                "@/components/*",
                "@/features/*",
                "@/app/*",
              ],
              message:
                "Domain is pure: it imports no framework, provider, cache, or configuration (CODEBASE-RULES 4).",
            },
          ],
        },
      ],
    },
  },

  // Components are product-neutral and never reach into features or the server.
  {
    files: ["src/components/**/*.tsx", "src/components/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/server/*", "@/integrations/*"],
              message:
                "Components are reusable primitives; they do not import features or server code (CODEBASE-RULES 4).",
            },
          ],
        },
      ],
    },
  },

  // Features consume domain contracts and application APIs, never providers.
  {
    files: ["src/features/**/*.ts", "src/features/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/integrations/*", "@/server/*"],
              message:
                "Features do not call Nansen or import server modules (CODEBASE-RULES 4).",
            },
          ],
        },
      ],
    },
  },
);
