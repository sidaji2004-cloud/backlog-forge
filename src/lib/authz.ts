import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const DEMO_READ_ONLY_MESSAGE =
  "This demo project is read-only. Create your own project to try the AI.";
const NOT_YOUR_PROJECT_MESSAGE = "You don't have access to this project.";
const MUST_SIGN_IN_MESSAGE = "You must be signed in to do that.";

/** Returns the current user id or throws. Server actions use this. */
export async function requireUser(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error(MUST_SIGN_IN_MESSAGE);
  return { id: session.user.id };
}

/**
 * Read-side visibility check. Called from every /projects/[id]/** page.
 * Signed-out visitors can see the demo project (isDemo=true); signed-in
 * visitors can see the demo project OR any project they own.
 */
export function canViewProject(
  project: { isDemo: boolean; userId: string | null },
  session: { user?: { id?: string | null } | null } | null
): boolean {
  if (project.isDemo) return true;
  const userId = session?.user?.id ?? null;
  return userId !== null && project.userId === userId;
}

/**
 * Central mutation guard. Called as the first line of every server action
 * that changes project data. Order matters:
 *   1. Demo project → block (even if the user "owns" it).
 *   2. Not signed in → block.
 *   3. Signed-in but not the owner → block.
 */
export async function guardProjectMutation(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { isDemo: true, userId: true },
  });
  if (!project) throw new Error("Project not found.");
  if (project.isDemo) throw new Error(DEMO_READ_ONLY_MESSAGE);

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  if (!currentUserId) throw new Error(MUST_SIGN_IN_MESSAGE);
  if (project.userId !== currentUserId)
    throw new Error(NOT_YOUR_PROJECT_MESSAGE);
}

export async function guardProjectMutationByDocument(
  documentId: string
): Promise<string> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      projectId: true,
      project: { select: { isDemo: true, userId: true } },
    },
  });
  if (!doc) throw new Error("Document not found.");
  if (doc.project.isDemo) throw new Error(DEMO_READ_ONLY_MESSAGE);
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  if (!currentUserId) throw new Error(MUST_SIGN_IN_MESSAGE);
  if (doc.project.userId !== currentUserId)
    throw new Error(NOT_YOUR_PROJECT_MESSAGE);
  return doc.projectId;
}

export async function guardProjectMutationByTicket(
  ticketId: string
): Promise<string> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      projectId: true,
      project: { select: { isDemo: true, userId: true } },
    },
  });
  if (!ticket) throw new Error("Ticket not found.");
  if (ticket.project.isDemo) throw new Error(DEMO_READ_ONLY_MESSAGE);
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  if (!currentUserId) throw new Error(MUST_SIGN_IN_MESSAGE);
  if (ticket.project.userId !== currentUserId)
    throw new Error(NOT_YOUR_PROJECT_MESSAGE);
  return ticket.projectId;
}

export async function guardProjectMutationBySprint(
  sprintId: string
): Promise<string> {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: {
      projectId: true,
      project: { select: { isDemo: true, userId: true } },
    },
  });
  if (!sprint) throw new Error("Sprint not found.");
  if (sprint.project.isDemo) throw new Error(DEMO_READ_ONLY_MESSAGE);
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  if (!currentUserId) throw new Error(MUST_SIGN_IN_MESSAGE);
  if (sprint.project.userId !== currentUserId)
    throw new Error(NOT_YOUR_PROJECT_MESSAGE);
  return sprint.projectId;
}
