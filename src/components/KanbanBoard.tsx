"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { HelpTip } from "@/components/HelpTip";
import { moveTicket } from "@/lib/ticket-actions";
import { type HelpTerm } from "@/lib/help-text";

export type KanbanTicket = {
  id: string;
  title: string;
  priority: string;
  estimate: number | null;
  status: string;
  isBlocked: boolean;
  sprintName: string | null;
};

const STATUSES: { key: string; label: string; helpTerm: HelpTerm }[] = [
  { key: "backlog", label: "Backlog", helpTerm: "backlog-status" },
  { key: "todo", label: "Todo", helpTerm: "todo-status" },
  { key: "in-progress", label: "In progress", helpTerm: "in-progress-status" },
  { key: "done", label: "Done", helpTerm: "done-status" },
];

export function KanbanBoard({
  projectId,
  initialTickets,
  editable,
}: {
  projectId: string;
  initialTickets: KanbanTicket[];
  editable: boolean;
}) {
  const [tickets, setTickets] = useState<KanbanTicket[]>(initialTickets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const ticketId = String(e.active.id);
    const overStatus = e.over?.id ? String(e.over.id) : null;
    if (!overStatus) return;

    const current = tickets.find((t) => t.id === ticketId);
    if (!current || current.status === overStatus) return;

    // Optimistically move the card
    const previousStatus = current.status;
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: overStatus } : t))
    );

    startTransition(async () => {
      try {
        await moveTicket(ticketId, overStatus);
      } catch (err) {
        // Roll back and surface the reason
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: previousStatus } : t
          )
        );
        toast.error(
          err instanceof Error ? err.message : "Couldn't move that ticket."
        );
      }
    });
  };

  if (initialTickets.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500">
        No tickets yet. Approve your PRD, then generate tickets from it.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {STATUSES.map(({ key, label, helpTerm }) => {
          const inColumn = tickets.filter((t) => t.status === key);
          const totalPts = inColumn.reduce(
            (sum, t) => sum + (t.estimate ?? 0),
            0
          );
          return (
            <Column
              key={key}
              statusKey={key}
              label={label}
              helpTerm={helpTerm}
              count={inColumn.length}
              totalPts={totalPts}
              editable={editable}
              isActiveDropTarget={activeId !== null}
            >
              {inColumn.map((t) => (
                <TicketCard
                  key={t.id}
                  projectId={projectId}
                  ticket={t}
                  editable={editable}
                  isDragging={activeId === t.id}
                />
              ))}
            </Column>
          );
        })}
      </div>
    </DndContext>
  );
}

function Column({
  statusKey,
  label,
  helpTerm,
  count,
  totalPts,
  editable,
  isActiveDropTarget,
  children,
}: {
  statusKey: string;
  label: string;
  helpTerm: HelpTerm;
  count: number;
  totalPts: number;
  editable: boolean;
  isActiveDropTarget: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey,
    disabled: !editable,
  });
  const highlight =
    editable && isActiveDropTarget
      ? isOver
        ? "ring-2 ring-violet-400 bg-violet-50"
        : "ring-1 ring-zinc-300"
      : "";

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg bg-zinc-100 p-3 transition ${highlight}`}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium">{label}</p>
          <HelpTip term={helpTerm} />
        </div>
        <span className="text-xs text-zinc-500">
          {count} · {totalPts} pts
        </span>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function TicketCard({
  projectId,
  ticket,
  editable,
  isDragging,
}: {
  projectId: string;
  ticket: KanbanTicket;
  editable: boolean;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
    disabled: !editable,
  });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
      }
    : { opacity: isDragging ? 0.6 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`block rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm hover:border-zinc-400 ${
        editable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <Link
        href={`/projects/${projectId}/tickets/${ticket.id}`}
        onClick={(e) => {
          // Prevent link nav when the user just finished dragging.
          if (isDragging) e.preventDefault();
        }}
        className="block font-medium leading-snug"
      >
        {ticket.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={ticket.priority} />
        {ticket.estimate != null && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
            {ticket.estimate} pt
          </span>
        )}
        {ticket.isBlocked && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
            ⛔ blocked
          </span>
        )}
        {ticket.sprintName && (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
            {ticket.sprintName}
          </span>
        )}
      </div>
    </div>
  );
}
