import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSprint } from "@/lib/ticket-actions";
import { StatusBadge } from "@/components/StatusBadge";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AutoPackButton } from "@/components/AutoPackButton";
import { DemoBanner } from "@/components/DemoBanner";
import { auth } from "@/auth";
import { canViewProject } from "@/lib/authz";
import { HelpTip } from "@/components/HelpTip";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sprints: {
        include: { tickets: true },
        orderBy: { startDate: "asc" },
      },
      tickets: { where: { sprintId: null } },
    },
  });
  if (!project) notFound();
  if (!canViewProject(project, await auth())) notFound();

  const backlogPoints = project.tickets.reduce((s, t) => s + (t.estimate ?? 0), 0);

  return (
    <div className="max-w-4xl">
      {project.isDemo && <DemoBanner />}
      <Breadcrumb
        items={[
          { label: project.name, href: `/projects/${id}` },
          { label: "Sprints" },
        ]}
      />
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Sprints</h1>
          <HelpTip term="sprints-box" size="md" />
        </div>
        <div className="flex overflow-hidden rounded-md border border-zinc-200 text-sm">
          <Link href={`/projects/${id}/board`} className="px-3 py-1 hover:bg-zinc-50">
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
            className="border-l border-zinc-200 bg-zinc-900 px-3 py-1 text-white"
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
      <p className="mt-1 text-sm text-zinc-500">
        Backlog: {project.tickets.length} unassigned ticket(s), {backlogPoints}{" "}
        point(s). Assign tickets to sprints from their detail page on the{" "}
        <Link href={`/projects/${id}/board`} className="underline">
          board
        </Link>
        .
      </p>

      <div className="mt-6 space-y-4">
        {project.sprints.map((s) => {
          const committed = s.tickets.reduce((sum, t) => sum + (t.estimate ?? 0), 0);
          const done = s.tickets
            .filter((t) => t.status === "done")
            .reduce((sum, t) => sum + (t.estimate ?? 0), 0);
          const over = committed > s.capacity;
          return (
            <div key={s.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.goal && <p className="text-sm text-zinc-600">Goal: {s.goal}</p>}
                  <p className="text-xs text-zinc-500">
                    {s.startDate.toLocaleDateString()} → {s.endDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center justify-end gap-1">
                    <p className={over ? "font-medium text-red-600" : ""}>
                      {committed} / {s.capacity} pts committed
                      {over && " — over capacity!"}
                    </p>
                    <HelpTip term="capacity" align="right" />
                  </div>
                  <p className="text-xs text-zinc-500">{done} pts done</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <AutoPackButton sprintId={s.id} />
                    <HelpTip term="auto-pack" align="right" />
                  </div>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: committed > 0 ? `${Math.min(100, (done / committed) * 100)}%` : "0%",
                  }}
                />
              </div>
              <ul className="mt-3 space-y-1">
                {s.tickets.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <StatusBadge status={t.status} />
                    <Link
                      href={`/projects/${id}/tickets/${t.id}`}
                      className="flex-1 truncate hover:underline"
                    >
                      {t.title}
                    </Link>
                    {t.estimate != null && (
                      <span className="text-xs text-zinc-500">{t.estimate} pt</span>
                    )}
                  </li>
                ))}
                {s.tickets.length === 0 && (
                  <li className="text-xs text-zinc-500">No tickets assigned yet.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-lg font-medium">New sprint</h2>
      <form
        action={createSprint.bind(null, id)}
        className="mt-3 grid max-w-lg gap-3 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <input
          name="name"
          required
          placeholder="Sprint name (e.g. Sprint 1)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="goal"
          placeholder="Sprint goal (one sentence)"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs text-zinc-500">
            Start
            <input
              type="date"
              name="startDate"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
            />
          </label>
          <label className="text-xs text-zinc-500">
            End
            <input
              type="date"
              name="endDate"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
            />
          </label>
          <label className="text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              Capacity (pts)
              <HelpTip term="capacity" />
            </span>
            <input
              type="number"
              name="capacity"
              defaultValue={20}
              min={1}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
            />
          </label>
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Create sprint
        </button>
      </form>
    </div>
  );
}
