import { defineConfig } from "vitest/config";
import path from "node:path";

// Konfigurasi Vitest untuk menguji layer non-UI (lib/ dan types/).
// Environment "node" cukup karena tidak ada rendering komponen React yang diuji di sini.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
