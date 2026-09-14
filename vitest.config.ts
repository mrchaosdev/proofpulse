import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const srcRoot = fileURLToPath(new URL("./src", import.meta.url));

// Tests execute in Node, which is a server context, so the "server-only"
// marker resolves to the package's own empty build rather than throwing.
const serverOnlyStub = fileURLToPath(
  new URL("./node_modules/server-only/empty.js", import.meta.url),
);
const alias = { "@": srcRoot, "server-only": serverOnlyStub };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "contract",
          include: ["tests/contract/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
