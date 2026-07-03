"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TICKET_STATUSES } from "@/lib/templates";
import { packTickets, type CandidateTicket } from "@/lib/sprint-packing";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * Move a ticket to a new status. A ticket cannot enter "in-progress" (or
 * "done") while any of its blockers are unfinished — that's the dependency
 * rule sprints live and die by.
 */
export async function setTicketStatus(ticketId: string, status: string) {
  if (!TICKET_STATUSES.includes(status as (typeof TICKET_STATUSES)[number])) {
    throw new Error(`Invalid status: ${status}`);
  }

  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { blockedBy: { include: { blocker: true } } },
  });

  if (status === "in-progress" || status === "done") {
    const unfinished = ticket.blockedBy.filter((d) => d.blocker.status !== "done");
    if (unfinished.length > 0) {
      throw new Error(
        `Blocked by unfinished ticket(s): ${unfinished
          .map((d) => `"${d.blocker.title}"`)
          .join(", ")}`
      );
    }
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status, completedAt: status === "done" ? new Date() : null },
  });
  revalidatePath(`/projects/${ticket.projectId}`, "layout");
}

export async function updateTicket(
  ticketId: string,
  data: { title?: string; description?: string; acceptanceCriteria?: string; priority?: string; estimate?: number | null }
) {
  const ticket = await prisma.ticket.update({ where: { id: ticketId }, data });
  revalidatePath(`/projects/${ticket.projectId}`, "layout");
}

export async function addDependency(ticketId: string, blockerId: string) {
  if (ticketId === blockerId) throw new Error("A ticket cannot block itself.");
  // reject if it would create a cycle (blocker already depends on ticket, transitively)
  const reaches = async (from: string, target: string): Promise<boolean> => {
    if (from === target) return true;
    const deps = await prisma.ticketDependency.findMany({ where: { ticketId: from } });
    for (const d of deps) if (await reaches(d.blockerId, target)) return true;
    return false;
  };
  if (await reaches(blockerId, ticketId)) {
    throw new Error("That dependency would create a cycle.");
  }
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  await prisma.ticketDependency.upsert({
    where: { ticketId_blockerId: { ticketId, blockerId } },
    create: { ticketId, blockerId },
    update: {},
  });
  revalidatePath(`/projects/${ticket.projectId}`, "layout");
}

export async function removeDependency(ticketId: string, blockerId: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  await prisma.ticketDependency.deleteMany({ where: { ticketId, blockerId } });
  revalidatePath(`/projects/${ticket.projectId}`, "layout");
}

export async function createSprint(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 20);
  const startDate = new Date(String(formData.get("startDate")));
  const endDate = new Date(String(formData.get("endDate")));
  if (!name || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Sprint needs a name, start date and end date.");
  }
  if (endDate <= startDate) throw new Error("Sprint must end after it starts.");

  await prisma.sprint.create({
    data: { projectId, name, goal, capacity, startDate, endDate },
  });
  revalidatePath(`/projects/${projectId}`, "layout");
  redirect(`/projects/${projectId}/sprints`);
}

export async function assignTicketToSprint(ticketId: string, sprintId: string | null) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { sprintId },
  });
  revalidatePath(`/projects/${ticket.projectId}`, "layout");
}

/**
 * Fill a sprint's remaining capacity from the unassigned backlog, respecting
 * both the capacity limit and dependency order (a ticket is only picked once
 * its blockers are done or already picked into this same sprint).
 */
export async function autoPackSprintAction(sprintId: string): Promise<number> {
  const sprint = await prisma.sprint.findUniqueOrThrow({
    where: { id: sprintId },
    include: { tickets: { select: { estimate: true } } },
  });

  const committed = sprint.tickets.reduce((sum, t) => sum + (t.estimate ?? 0), 0);
  const remainingCapacity = Math.max(0, sprint.capacity - committed);
  if (remainingCapacity <= 0) {
    throw new Error("This sprint is already at or over capacity.");
  }

  const backlog = await prisma.ticket.findMany({
    where: { projectId: sprint.projectId, sprintId: null, estimate: { not: null } },
    include: { blockedBy: { include: { blocker: { select: { status: true } } } } },
  });
  if (backlog.length === 0) {
    throw new Error("No unassigned, estimated tickets to pack.");
  }

  const sorted = [...backlog].sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    return rankDiff !== 0 ? rankDiff : a.createdAt.getTime() - b.createdAt.getTime();
  });

  const candidates: CandidateTicket[] = sorted.map((t) => ({
    id: t.id,
    estimate: t.estimate!,
    blockerIds: t.blockedBy.map((d) => d.blockerId),
  }));
  const blockerStatus: Record<string, string> = {};
  for (const t of sorted) {
    for (const d of t.blockedBy) blockerStatus[d.blockerId] = d.blocker.status;
  }

  const pickedIds = packTickets(candidates, blockerStatus, remainingCapacity);
  if (pickedIds.length === 0) {
    throw new Error(
      "Nothing could be packed — remaining capacity may be too small, or every candidate is still blocked."
    );
  }

  // One bulk write, not a loop of individual updates — a lesson learned the
  // hard way from a transaction-timeout bug elsewhere in this app.
  await prisma.ticket.updateMany({
    where: { id: { in: pickedIds } },
    data: { sprintId },
  });

  revalidatePath(`/projects/${sprint.projectId}`, "layout");
  return pickedIds.length;
}
