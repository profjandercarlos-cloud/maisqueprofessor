import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Testes de integração contra o banco real (disposable rows, sempre
    // limpos no final) + chamadas de IA mockadas — dão mais folga que o
    // padrão de unit test.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
