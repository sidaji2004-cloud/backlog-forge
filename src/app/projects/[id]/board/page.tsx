import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { GenerateTicketsButton } from "@/components/GenerateButtons";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DemoBanner } from "@/components/DemoBanner";
import { auth } from "@/auth";
import { canViewProject } from "@/lib/authz";
import { KanbanBoard, type KanbanTicket } from "@/components/KanbanBoard";
import { HelpTip } from "@/components/HelpTip";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tickets: {
        include: { blockedBy: { include: { blocker: true } }, sprint: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) notFound();
  if (!canViewProject(project, await auth())) notFound();

  return (
    <div>
      {project.isDemo && <DemoBanner />}
      <Breadcrumb
        items={[
          { label: project.name, href: `/projects/${id}` },
          { label: "Board" },
        ]}
      />
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Ticket board</h1>
        <div className="flex overflow-hidden rounded-md border border-zinc-200 text-sm">
          <Link
            href={`/projects/${id}/board`}
            className="bg-zinc-900 px-3 py-1 text-white"
          >
            Board
          </Link>
          <Link
            href={`/projects/${id}/board/graph`}
            className="border-l border-zinc-200 px-3 py-1 hover:bg-zinc-50"
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
        <GenerateTicketsButton projectId={id} />
        {project.tickets.length > 0 && (
          <ExportCsvButton projectId={id} projectName={project.name} />
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
        <span>Drag any card between columns to change its status. Blocked tickets snap back with an explanation.</span>
        <HelpTip term="board-tab" />
      </div>

      <KanbanBoard
        projectId={id}
        editable={!project.isDemo}
        initialTickets={project.tickets.map<KanbanTicket>((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          estimate: t.estimate,
          status: t.status,
          isBlocked:
            t.status !== "done" &&
            t.blockedBy.some((d) => d.blocker.status !== "done"),
          sprintName: t.sprint?.name ?? null,
        }))}
      />
    </div>
  );
}
