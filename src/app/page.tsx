import Link from "next/link";
import { prisma } from "@/lib/db";
import { DOC_TYPES, DOC_DESCRIPTIONS } from "@/lib/templates";

export default async function Home() {
  const projects = await prisma.project.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    include: { documents: true, tickets: true },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="mt-2 text-zinc-600">
        BacklogForge walks a product idea through the full PM chain:{" "}
        <strong>BRD</strong> (why) → <strong>PRD</strong> (what) →{" "}
        <strong>FSD</strong> (how it behaves) → a real backlog you can export as
        a CSV for Jira or Linear.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {DOC_TYPES.map((t) => (
          <div key={t} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="font-medium">{t}</p>
            <p className="mt-1 text-xs text-zinc-500">{DOC_DESCRIPTIONS[t]}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-medium">Your projects</h2>
      <div className="mt-3 space-y-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
          >
            <p className="font-medium">{p.name}</p>
            <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{p.idea}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {p.documents.length} document(s) · {p.tickets.length} ticket(s)
            </p>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-zinc-500">
            No projects yet —{" "}
            <Link href="/projects/new" className="underline">
              create your first one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
