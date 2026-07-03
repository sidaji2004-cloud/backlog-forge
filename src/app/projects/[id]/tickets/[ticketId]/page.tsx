import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TicketDetail } from "@/components/TicketDetail";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string; ticketId: string }>;
}) {
  const { id, ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      blockedBy: { include: { blocker: true } },
      blocks: { include: { ticket: true } },
      sprint: true,
    },
  });
  if (!ticket || ticket.projectId !== id) notFound();

  const [others, sprints, project] = await Promise.all([
    prisma.ticket.findMany({
      where: { projectId: id, id: { not: ticketId } },
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sprint.findMany({ where: { projectId: id }, orderBy: { startDate: "asc" } }),
    prisma.project.findUniqueOrThrow({ where: { id } }),
  ]);

  return (
    <div className="max-w-3xl">
      <Breadcrumb
        items={[
          { label: project.name, href: `/projects/${id}` },
          { label: "Board", href: `/projects/${id}/board` },
          { label: "Ticket" },
        ]}
      />
      <TicketDetail
        ticket={{
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          acceptanceCriteria: ticket.acceptanceCriteria,
          priority: ticket.priority,
          estimate: ticket.estimate,
          status: ticket.status,
          sourceSection: ticket.sourceSection,
          sprintId: ticket.sprintId,
        }}
        blockedBy={ticket.blockedBy.map((d) => ({
          id: d.blocker.id,
          title: d.blocker.title,
          status: d.blocker.status,
        }))}
        blocks={ticket.blocks.map((d) => ({
          id: d.ticket.id,
          title: d.ticket.title,
          status: d.ticket.status,
        }))}
        otherTickets={others}
        sprints={sprints.map((s) => ({ id: s.id, name: s.name }))}
        projectId={id}
      />
    </div>
  );
}
