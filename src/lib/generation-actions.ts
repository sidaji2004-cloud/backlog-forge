"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  generateDocument,
  generateTickets,
  generateClarifyingQuestions,
  type GeneratedTicket,
} from "@/lib/ai";
import type { DocType } from "@/lib/templates";
import { guardProjectMutation } from "@/lib/authz";

async function latestDoc(projectId: string, type: string) {
  return prisma.document.findFirst({
    where: { projectId, type },
    orderBy: { version: "desc" },
  });
}

/** Turns the optional Discovery fields into a short block for the BRD prompt. */
function formatDiscoveryContext(project: {
  audience: string | null;
  techStack: string | null;
  constraints: string | null;
}): string | undefined {
  const lines: string[] = [];
  if (project.audience) lines.push(`Target audience: ${project.audience}`);
  if (project.techStack) lines.push(`Tech stack: ${project.techStack}`);
  if (project.constraints) lines.push(`Key constraints: ${project.constraints}`);
  return lines.length > 0 ? lines.join("\n") : undefined;
}

/**
 * Fetch up to 3 optional clarifying questions before a first BRD generation.
 * Read-only — nothing is saved here.
 */
export async function getClarifyingQuestionsAction(
  projectId: string
): Promise<string[]> {
  await guardProjectMutation(projectId);
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });
  return generateClarifyingQuestions(project.idea, formatDiscoveryContext(project));
}

/**
 * Generate (or regenerate) a document with AI.
 * BRD uses the idea (plus optional clarifying-question `answers`); PRD uses
 * the latest BRD; FSD uses the latest PRD.
 */
export async function generateDocAction(
  projectId: string,
  type: DocType,
  answers?: string
) {
  await guardProjectMutation(projectId);
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  });

  let context: string | null = null;
  if (type === "PRD") {
    const brd = await latestDoc(projectId, "BRD");
    if (!brd) throw new Error("Create or generate a BRD first — the PRD builds on it.");
    context = brd.content;
  } else if (type === "FSD") {
    const prd = await latestDoc(projectId, "PRD");
    if (!prd) throw new Error("Create or generate a PRD first — the FSD builds on it.");
    context = prd.content;
  }

  let discoveryContext =
    type === "BRD" ? formatDiscoveryContext(project) : undefined;
  if (type === "BRD" && answers?.trim()) {
    discoveryContext = discoveryContext
      ? `${discoveryContext}\n\nFounder's answers to clarifying questions:\n${answers}`
      : `Founder's answers to clarifying questions:\n${answers}`;
  }
  const content = await generateDocument(type, project.idea, context, discoveryContext);

  const existing = await latestDoc(projectId, type);
  if (existing) {
    // regenerating: snapshot old version, save new content as a new draft version
    await prisma.document.create({
      data: {
        projectId,
        type,
        content,
        version: existing.version + 1,
        status: "draft",
      },
    });
  } else {
    await prisma.document.create({ data: { projectId, type, content } });
  }
  revalidatePath(`/projects/${projectId}`, "layout");
}

/**
 * Ask Gemini to turn the latest PRD (+ FSD if present) into a ticket list.
 * Read-only — nothing is saved. The caller shows these for review, then
 * calls `saveReviewedTicketsAction` with the confirmed subset.
 */
export async function generateTicketsAction(
  projectId: string
): Promise<GeneratedTicket[]> {
  await guardProjectMutation(projectId);
  const prd = await latestDoc(projectId, "PRD");
  if (!prd) throw new Error("A PRD is needed before generating tickets.");
  const fsd = await latestDoc(projectId, "FSD");

  return generateTickets(prd.content, fsd?.content ?? null);
}

/**
 * Save the reviewed subset of a generated ticket list. `reviewed` must be
 * the SAME LENGTH and INDEX ORDER as the original generated array, with
 * `null` in place of any ticket the user deselected — this keeps `dependsOn`
 * (which references indexes into that original array) valid with no
 * remapping. A dependency that points at a deselected (null) slot is simply
 * dropped rather than blocking the save — the simple, safe tradeoff for a
 * hobby-scale app; the review UI shows a "required by N" hint so the choice
 * is informed, but it's never a hard block.
 */
export async function saveReviewedTicketsAction(
  projectId: string,
  reviewed: (GeneratedTicket | null)[]
): Promise<number> {
  await guardProjectMutation(projectId);
  const savedCount = reviewed.filter((t) => t !== null).length;
  if (savedCount === 0) {
    throw new Error("No tickets were selected to save.");
  }

  // Bulk-insert instead of one create() per ticket/dependency — a sequential
  // loop against a remote database (Neon) can easily exceed Prisma's default
  // 5s interactive-transaction timeout once a backlog has more than a
  // handful of tickets. createManyAndReturn keeps this to two round trips.
  await prisma.$transaction(
    async (tx) => {
      const toCreate = reviewed
        .map((t, index) => (t ? { index, ticket: t } : null))
        .filter((x): x is { index: number; ticket: GeneratedTicket } => x !== null);

      const createdRows = await tx.ticket.createManyAndReturn({
        data: toCreate.map(({ ticket: t }) => ({
          projectId,
          title: t.title,
          description: t.description,
          acceptanceCriteria: t.acceptanceCriteria,
          priority: t.priority,
          estimate: t.estimate,
          sourceSection: t.sourceSection,
        })),
        select: { id: true },
      });

      // Map created rows back to their original (pre-review) array index so
      // dependsOn indexes still resolve correctly.
      const created: (string | null)[] = new Array(reviewed.length).fill(null);
      toCreate.forEach(({ index }, k) => {
        created[index] = createdRows[k].id;
      });

      const dependencies: { ticketId: string; blockerId: string }[] = [];
      for (let i = 0; i < reviewed.length; i++) {
        const t = reviewed[i];
        if (!t || !created[i]) continue;
        for (const dep of t.dependsOn) {
          if (dep === i) continue;
          const blockerId = created[dep];
          if (!blockerId) continue; // dependency target was deselected — drop the link
          dependencies.push({ ticketId: created[i]!, blockerId });
        }
      }
      if (dependencies.length > 0) {
        await tx.ticketDependency.createMany({ data: dependencies });
      }
    },
    { timeout: 15000 } // safety margin for remote-DB latency, not load-bearing anymore
  );

  revalidatePath(`/projects/${projectId}`, "layout");
  return savedCount;
}
