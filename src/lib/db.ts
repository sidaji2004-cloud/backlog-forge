import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a free Postgres database at https://neon.tech and put its connection string in .env.local"
    );
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Lazy proxy so importing this module doesn't require DATABASE_URL
// (Next.js build-time page-data collection imports it without a live DB).
// The real client is created — and the error thrown — only on first use.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = makeClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  },
});
