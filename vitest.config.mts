import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json"],
      include: [
        "lib/auth.ts",
        "lib/queries.ts",
        "app/api/items/route.ts",
        "app/api/items/[id]/route.ts",
        "app/api/collections/route.ts",
        "app/login/page.tsx",
        "components/delete-item-button.tsx",
        "components/type-filter.tsx",
        "components/search-bar.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("."),
    },
  },
});
