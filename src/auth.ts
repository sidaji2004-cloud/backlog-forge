import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

// Auth.js v5 config. GitHub OAuth + Prisma database sessions.
// Env vars required: AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET.
// On Vercel also set AUTH_URL to the deployed URL.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
  },
});
