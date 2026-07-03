"use server";

import { prisma } from "@/lib/db";

export type CsvFormat = "generic" | "jira" | "linear";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRows(header: string[], rows: string[][]): string {
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

// Jira's default priority scheme; Linear's is a shorter Urgent/High/Medium/Low.
const JIRA_PRIORITY: Record<string, string> = {
  low: "Lowest",
  medium: "Medium",
  high: "Highest",
};
const LINEAR_PRIORITY: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
const LINEAR_STATUS: Record<string, string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

/**
 * Export the backlog as CSV. Neither Jira nor Linear enforces one fixed CSV
 * schema — both let you confirm/adjust column mapping on import — so these
 * presets use each tool's commonly-expected column names to get close with
 * minimal manual remapping, not a guaranteed exact match.
 */
export async function exportTicketsCsv(
  projectId: string,
  format: CsvFormat = "generic"
): Promise<string> {
  const tickets = await prisma.ticket.findMany({
    where: { projectId },
    include: { blockedBy: { include: { blocker: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (format === "jira") {
    const header = ["Summary", "Issue Type", "Description", "Priority", "Story Points", "Labels"];
    const rows = tickets.map((t) => [
      t.title,
      "Story",
      t.acceptanceCriteria
        ? `${t.description}\n\nAcceptance Criteria:\n${t.acceptanceCriteria}`
        : t.description,
      JIRA_PRIORITY[t.priority] ?? t.priority,
      t.estimate?.toString() ?? "",
      (t.sourceSection ?? "").replace(/[^a-zA-Z0-9]+/g, "-"),
    ]);
    return toRows(header, rows);
  }

  if (format === "linear") {
    const header = ["Title", "Description", "Priority", "Status", "Estimate", "Labels"];
    const rows = tickets.map((t) => [
      t.title,
      t.acceptanceCriteria
        ? `${t.description}\n\nAcceptance Criteria:\n${t.acceptanceCriteria}`
        : t.description,
      LINEAR_PRIORITY[t.priority] ?? t.priority,
      LINEAR_STATUS[t.status] ?? t.status,
      t.estimate?.toString() ?? "",
      (t.sourceSection ?? "").replace(/[^a-zA-Z0-9]+/g, "-"),
    ]);
    return toRows(header, rows);
  }

  const header = [
    "Title",
    "Description",
    "Acceptance Criteria",
    "Priority",
    "Estimate",
    "Status",
    "Source Section",
    "Blocked By",
  ];
  const rows = tickets.map((t) => [
    t.title,
    t.description,
    t.acceptanceCriteria,
    t.priority,
    t.estimate?.toString() ?? "",
    t.status,
    t.sourceSection ?? "",
    t.blockedBy.map((d) => d.blocker.title).join("; "),
  ]);
  return toRows(header, rows);
}
