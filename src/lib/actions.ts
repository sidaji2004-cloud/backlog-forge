"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { blankTemplate, DOC_STATUSES, type DocType } from "@/lib/templates";
import {
  guardProjectMutation,
  guardProjectMutationByDocument,
  requireUser,
} from "@/lib/authz";

function optionalField(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const idea = String(formData.get("idea") ?? "").trim();
  if (!name || !idea) throw new Error("Name and idea are required.");

  const project = await prisma.project.create({
    data: {
      name,
      idea,
      audience: optionalField(formData, "audience"),
      techStack: optionalField(formData, "techStack"),
      constraints: optionalField(formData, "constraints"),
      userId: user.id,
    },
  });
  revalidatePath("/", "layout");
  redirect(`/projects/${project.id}`);
}

export async function createDocument(projectId: string, type: DocType) {
  await guardProjectMutation(projectId);
  const latest = await prisma.document.findFirst({
    where: { projectId, type },
    orderBy: { version: "desc" },
  });
  if (latest) return; // already exists — editor page handles it

  await prisma.document.create({
    data: { projectId, type, content: blankTemplate(type) },
  });
  revalidatePath(`/projects/${projectId}`, "layout");
}

export async function updateDocumentContent(
  documentId: string,
  content: string
) {
  await guardProjectMutationByDocument(documentId);
  const doc = await prisma.document.update({
    where: { id: documentId },
    data: { content },
  });
  revalidatePath(`/projects/${doc.projectId}`, "layout");
}

export async function setDocumentStatus(documentId: string, status: string) {
  if (!DOC_STATUSES.includes(status as (typeof DOC_STATUSES)[number])) {
    throw new Error(`Invalid status: ${status}`);
  }
  await guardProjectMutationByDocument(documentId);
  const doc = await prisma.document.update({
    where: { id: documentId },
    data: { status },
  });
  revalidatePath(`/projects/${doc.projectId}`, "layout");
}

/** Snapshot the current version and start a new editable draft version. */
export async function createNewVersion(documentId: string) {
  await guardProjectMutationByDocument(documentId);
  const doc = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
  });
  await prisma.document.create({
    data: {
      projectId: doc.projectId,
      type: doc.type,
      content: doc.content,
      version: doc.version + 1,
      status: "draft",
    },
  });
  revalidatePath(`/projects/${doc.projectId}`, "layout");
}
