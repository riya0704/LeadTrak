import { defineConfig } from "drizzle-kit";
import "dotenv/config";

// Note: DATABASE_URL is still required for the app to run,
// but we prevent the build from failing if it's not present
// during the Vercel build's dependency analysis.
if (!process.env.DATABASE_URL && process.env.NODE_ENV === "development") {
  console.warn("DATABASE_URL is missing from .env file. This is required for local development.");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Vercel's build environment might not have the env var available at this stage.
    // The runtime code in src/lib/db/index.ts handles the connection.
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
