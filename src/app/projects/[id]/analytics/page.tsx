import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/Breadcrumb";
import { computeSprintStats, computeCycleTimeSummary } from "@/lib/analytics";

const CHART_HEIGHT = 160;
const BAR_WIDTH = 26;
const BAR_GAP = 6;
const GROUP_WIDTH = BAR_WIDTH * 2 + BAR_GAP + 24;

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sprints: { orderBy: { startDate: "asc" } },
      tickets: true,
    },
  });
  if (!project) notFound();

  const sprints = project.sprints.map((s) => ({ id: s.id, name: s.name }));
  const tickets = project.tickets.map((t) => ({
    id: t.id,
    title: t.title,
    estimate: t.estimate,
    status: t.status,
    sprintId: t.sprintId,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
  }));

  const sprintStats = computeSprintStats(sprints, tickets);
  const cycleTime = computeCycleTimeSummary(tickets);

  const maxPoints = Math.max(1, ...sprintStats.map((s) => s.committedPoints));
  const chartWidth = Math.max(1, sprintStats.length) * GROUP_WIDTH;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: project.name, href: `/projects/${id}` },
          { label: "Analytics" },
        ]}
      />
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold">Analytics</h1>
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
            className="border-l border-zinc-200 px-3 py-1 hover:bg-zinc-50"
          >
            Sprints
          </Link>
          <Link
            href={`/projects/${id}/analytics`}
            className="border-l border-zinc-200 bg-zinc-900 px-3 py-1 text-white"
          >
            Analytics
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-700">
          Sprint commitment vs completion
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Gray = points committed to the sprint. Green = points actually completed.
        </p>

        {sprintStats.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No sprints yet. Create one from the Sprints tab.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT + 40}`}
            className="mt-4 w-full"
            style={{ maxWidth: chartWidth }}
          >
            {sprintStats.map((s, i) => {
              const groupX = i * GROUP_WIDTH;
              const committedHeight = (s.committedPoints / maxPoints) * CHART_HEIGHT;
              const completedHeight = (s.completedPoints / maxPoints) * CHART_HEIGHT;
              return (
                <g key={s.sprintId}>
                  <rect
                    x={groupX}
                    y={CHART_HEIGHT - committedHeight}
                    width={BAR_WIDTH}
                    height={committedHeight}
                    fill="#d4d4d8"
                  />
                  <rect
                    x={groupX + BAR_WIDTH + BAR_GAP}
                    y={CHART_HEIGHT - completedHeight}
                    width={BAR_WIDTH}
                    height={completedHeight}
                    fill="#22c55e"
                  />
                  <text
                    x={groupX + BAR_WIDTH + BAR_GAP / 2}
                    y={CHART_HEIGHT + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#71717a"
                  >
                    {s.sprintName.length > 10 ? `${s.sprintName.slice(0, 9)}…` : s.sprintName}
                  </text>
                  <text
                    x={groupX + BAR_WIDTH + BAR_GAP / 2}
                    y={CHART_HEIGHT + 28}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#a1a1aa"
                  >
                    {s.completedPoints}/{s.committedPoints} pts
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-700">Cycle time</h2>
        {cycleTime.averageDays === null ? (
          <p className="mt-2 text-sm text-zinc-500">No completed tickets yet.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-600">
              Average <span className="font-medium">{cycleTime.averageDays}</span> day
              {cycleTime.averageDays === 1 ? "" : "s"} from creation to done, across{" "}
              {cycleTime.completedCount} completed ticket
              {cycleTime.completedCount === 1 ? "" : "s"}.
            </p>
            <p className="mt-3 text-xs font-medium text-zinc-500">Slowest tickets</p>
            <ul className="mt-1 space-y-1">
              {cycleTime.slowest.map((t) => (
                <li key={t.ticketId} className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/projects/${id}/tickets/${t.ticketId}`}
                    className="flex-1 truncate hover:underline"
                  >
                    {t.title}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {t.days} day{t.days === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
