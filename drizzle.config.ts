import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load env manually.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Use DIRECT_URL (direct :5432 or session pooler :5432) for DDL/migrations,
    // not the transaction pooler.
    url: process.env.DIRECT_URL!,
  },
});
