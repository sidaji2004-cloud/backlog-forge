import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DependencyGraph } from "@/components/DependencyGraph";

export default async function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tickets: {
        include: { blockedBy: { include: { blocker: { select: { status: true } } } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  const tickets = project.tickets.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    blockerIds: t.blockedBy.map((d) => d.blockerId),
    isBlocked:
      t.status !== "done" &&
      t.blockedBy.some((d) => d.blocker.status !== "done"),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: project.name, href: `/projects/${id}` },
          { label: "Board", href: `/projects/${id}/board` },
          { label: "Graph" },
        ]}
      />
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Dependency graph</h1>
        <div className="flex overflow-hidden rounded-md border border-zinc-200 text-sm">
          <Link
            href={`/projects/${id}/board`}
            className="px-3 py-1 hover:bg-zinc-50"
          >
            Board
          </Link>
          <Link
            href={`/projects/${id}/board/graph`}
            className="border-l border-zinc-200 bg-zinc-900 px-3 py-1 text-white"
          >
            Graph
          </Link>
          <Link
            href={`/projects/${id}/sprints`}
            className="border-l border-zinc-200 px-3 py-1 hover:bg-zinc-50"
          >
            Sprints
          </Link>
          <Link
            href={`/projects/${id}/analytics`}
            className="border-l border-zinc-200 px-3 py-1 hover:bg-zinc-50"
          >
            Analytics
          </Link>
        </div>
      </div>

      {tickets.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          No tickets yet. Approve your PRD, then generate tickets from it.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-500">
            Drag from the right edge of one ticket to the left edge of
            another to add a dependency. Click an arrow to remove it.
          </p>
          <div className="mt-4">
            <DependencyGraph tickets={tickets} projectId={id} />
          </div>
        </>
      )}
    </div>
  );
}
