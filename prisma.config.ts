import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI (unlike Next.js) doesn't auto-load .env.local — load it
// explicitly so `prisma migrate`/`prisma db seed` see DATABASE_URL.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
