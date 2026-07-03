import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TICKET_STATUSES } from "@/lib/templates";
import { StatusBadge } from "@/components/StatusBadge";
import { GenerateTicketsButton } from "@/components/GenerateButtons";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DemoBanner } from "@/components/DemoBanner";
import { auth } from "@/auth";
import { canViewProject } from "@/lib/authz";

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

      {project.tickets.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          No tickets yet. Approve your PRD, then generate tickets from it.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {TICKET_STATUSES.map((status) => {
            const tickets = project.tickets.filter((t) => t.status === status);
            return (
              <div key={status} className="rounded-lg bg-zinc-100 p-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-medium capitalize">{status}</p>
                  <span className="text-xs text-zinc-500">{tickets.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {tickets.map((t) => {
                    const blocked =
                      t.status !== "done" &&
                      t.blockedBy.some((d) => d.blocker.status !== "done");
                    return (
                      <Link
                        key={t.id}
                        href={`/projects/${id}/tickets/${t.id}`}
                        className="block rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm hover:border-zinc-400"
                      >
                        <p className="font-medium leading-snug">{t.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={t.priority} />
                          {t.estimate != null && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                              {t.estimate} pt
                            </span>
                          )}
                          {blocked && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                              ⛔ blocked
                            </span>
                          )}
                          {t.sprint && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                              {t.sprint.name}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
