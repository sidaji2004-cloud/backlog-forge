import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Toaster } from "sonner";
import "./globals.css";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BacklogForge",
  description: "Idea → BRD/PRD/FSD → backlog, exportable to Jira/Linear",
};

// Every page reads live data from Postgres — no static pre-rendering at build time.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Never crash the layout — an unconfigured or unreachable DB just yields no
  // projects in the sidebar. Individual pages surface the real error.
  let projects: { id: string; name: string }[] = [];
  try {
    projects = await prisma.project.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    });
  } catch {
    projects = [];
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex bg-zinc-50 text-zinc-900">
        <Toaster position="bottom-right" richColors closeButton />
        <CommandPalette projects={projects} />
        <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
          <Link href="/" className="px-4 py-4 border-b border-zinc-200 block">
            <span className="font-semibold text-lg">BacklogForge</span>
            <span className="block text-xs text-zinc-500">
              idea → docs → backlog → export
            </span>
          </Link>
          <Sidebar projects={projects} />
          <div className="p-3 border-t border-zinc-200 space-y-2">
            <p className="px-1 text-xs text-zinc-400">
              Press{" "}
              <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1 py-0.5 font-mono">
                {"⌘"}K
              </kbd>{" "}
              to jump anywhere
            </p>
            <Link
              href="/projects/new"
              className="block w-full rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700"
            >
              + New project
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </body>
    </html>
  );
}
