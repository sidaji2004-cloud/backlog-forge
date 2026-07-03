export type AnalyticsTicket = {
  id: string;
  title: string;
  estimate: number | null;
  status: string;
  sprintId: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type AnalyticsSprint = {
  id: string;
  name: string;
};

export type SprintStat = {
  sprintId: string;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
  ticketCount: number;
};

export type CycleTimeStat = {
  ticketId: string;
  title: string;
  days: number;
};

export type CycleTimeSummary = {
  averageDays: number | null;
  completedCount: number;
  slowest: CycleTimeStat[];
};

/**
 * Per-sprint commitment vs completion. Sprints with zero tickets still
 * produce a zero-row rather than being filtered out, so a PM can see a
 * sprint that was planned but never populated.
 */
export function computeSprintStats(
  sprints: AnalyticsSprint[],
  tickets: AnalyticsTicket[]
): SprintStat[] {
  return sprints.map((s) => {
    const inSprint = tickets.filter((t) => t.sprintId === s.id);
    const committedPoints = inSprint.reduce((sum, t) => sum + (t.estimate ?? 0), 0);
    const completedPoints = inSprint
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.estimate ?? 0), 0);
    return {
      sprintId: s.id,
      sprintName: s.name,
      committedPoints,
      completedPoints,
      ticketCount: inSprint.length,
    };
  });
}

/**
 * Cycle time = completedAt - createdAt, in days, for tickets that currently
 * have a completedAt set. A ticket that was completed then reopened has its
 * completedAt cleared by setTicketStatus, so it naturally drops out here.
 */
export function computeCycleTimeSummary(
  tickets: AnalyticsTicket[],
  slowestLimit = 5
): CycleTimeSummary {
  const completed = tickets.filter(
    (t): t is AnalyticsTicket & { completedAt: Date } => t.completedAt != null
  );

  const stats: CycleTimeStat[] = completed.map((t) => ({
    ticketId: t.id,
    title: t.title,
    days:
      Math.round(
        ((t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24)) * 10
      ) / 10,
  }));

  const averageDays =
    stats.length === 0
      ? null
      : Math.round((stats.reduce((sum, s) => sum + s.days, 0) / stats.length) * 10) / 10;

  const slowest = [...stats].sort((a, b) => b.days - a.days).slice(0, slowestLimit);

  return { averageDays, completedCount: stats.length, slowest };
}
