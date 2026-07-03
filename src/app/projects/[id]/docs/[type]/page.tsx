import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  DOC_TYPES,
  DOC_LABELS,
  DOC_SECTIONS,
  type DocType,
} from "@/lib/templates";
import { DocumentEditor } from "@/components/DocumentEditor";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; type: string }>;
}) {
  const { id, type } = await params;
  const docType = type.toUpperCase() as DocType;
  if (!DOC_TYPES.includes(docType)) notFound();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const doc = await prisma.document.findFirst({
    where: { projectId: id, type: docType },
    orderBy: { version: "desc" },
  });
  if (!doc) notFound();

  const olderVersions = await prisma.document.count({
    where: { projectId: id, type: docType, version: { lt: doc.version } },
  });

  return (
    <div className="max-w-5xl">
      <Breadcrumb
        items={[
          { label: project.name, href: `/projects/${id}` },
          { label: docType },
        ]}
      />
      <h1 className="mt-1 text-2xl font-semibold">{DOC_LABELS[docType]}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
        <DocumentEditor
          documentId={doc.id}
          initialContent={doc.content}
          status={doc.status}
          version={doc.version}
          olderVersions={olderVersions}
        />
        <aside className="rounded-lg border border-zinc-200 bg-white p-4 h-fit">
          <p className="text-sm font-medium">Expected sections</p>
          <p className="mt-1 text-xs text-zinc-500">
            A good {docType} usually covers:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-600 list-disc pl-4">
            {DOC_SECTIONS[docType].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
