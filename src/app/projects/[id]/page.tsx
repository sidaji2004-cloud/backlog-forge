import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createDocument } from "@/lib/actions";
import {
  DOC_TYPES,
  DOC_LABELS,
  DOC_DESCRIPTIONS,
  type DocType,
} from "@/lib/templates";
import { StatusBadge } from "@/components/StatusBadge";
import { GenerateDocButton } from "@/components/GenerateButtons";
import {
  ProgressStepper,
  computeProjectSteps,
} from "@/components/ProgressStepper";
import { DemoBanner } from "@/components/DemoBanner";
import { auth } from "@/auth";
import { canViewProject } from "@/lib/authz";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { version: "desc" } },
      tickets: true,
      sprints: true,
    },
  });
  if (!project) notFound();
  if (!canViewProject(project, await auth())) notFound();

  // latest version of each doc type
  const latestByType = new Map<string, (typeof project.documents)[number]>();
  for (const d of project.documents) {
    if (!latestByType.has(d.type)) latestByType.set(d.type, d);
  }

  return (
    <div className="max-w-4xl">
      {project.isDemo && <DemoBanner />}
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <p className="mt-2 text-zinc-600">{project.idea}</p>

      <div className="mt-6">
        <ProgressStepper steps={computeProjectSteps(project)} />
      </div>

      <h2 className="mt-8 text-lg font-medium">Documents</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Work left to right — each document builds on the previous one.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {DOC_TYPES.map((type) => {
          const doc = latestByType.get(type);
          return (
            <div
              key={type}
              className="rounded-lg border border-zinc-200 bg-white p-4 flex flex-col"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{type}</p>
                {doc && <StatusBadge status={doc.status} />}
              </div>
              <p className="mt-1 text-xs text-zinc-500 flex-1">
                {DOC_DESCRIPTIONS[type]}
              </p>
              <div className="mt-3 space-y-2">
                {doc ? (
                  <Link
                    href={`/projects/${project.id}/docs/${type}`}
                    className="block rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm hover:bg-zinc-50"
                  >
                    Open v{doc.version}
                  </Link>
                ) : (
                  <form
                    action={createDocument.bind(null, project.id, type as DocType)}
                  >
                    <button
                      type="submit"
                      className="w-full rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                    >
                      Start {DOC_LABELS[type].split(" ")[0]} draft
                    </button>
                  </form>
                )}
                <GenerateDocButton
                  projectId={project.id}
                  type={type as DocType}
                  hasExisting={!!doc}
                />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-lg font-medium">Execution</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Link
          href={`/projects/${project.id}/board`}
          className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
        >
          <p className="font-medium">Ticket board</p>
          <p className="mt-1 text-xs text-zinc-500">
            {project.tickets.length} ticket(s) — kanban view, acceptance
            criteria, dependencies, CSV export.
          </p>
        </Link>
        <Link
          href={`/projects/${project.id}/sprints`}
          className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
        >
          <p className="font-medium">Sprints</p>
          <p className="mt-1 text-xs text-zinc-500">
            {project.sprints.length} sprint(s) — plan batches of tickets with a
            capacity.
          </p>
        </Link>
      </div>
    </div>
  );
}
