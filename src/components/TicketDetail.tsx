"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  setTicketStatus,
  updateTicket,
  addDependency,
  removeDependency,
  assignTicketToSprint,
} from "@/lib/ticket-actions";
import { TICKET_STATUSES, TICKET_PRIORITIES } from "@/lib/templates";
import { StatusBadge } from "@/components/StatusBadge";

type TicketRef = { id: string; title: string; status: string };

export function TicketDetail({
  ticket,
  blockedBy,
  blocks,
  otherTickets,
  sprints,
  projectId,
}: {
  ticket: {
    id: string;
    title: string;
    description: string;
    acceptanceCriteria: string;
    priority: string;
    estimate: number | null;
    status: string;
    sourceSection: string | null;
    sprintId: string | null;
  };
  blockedBy: TicketRef[];
  blocks: TicketRef[];
  otherTickets: TicketRef[];
  sprints: { id: string; name: string }[];
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ac, setAc] = useState(ticket.acceptanceCriteria);
  const [acDirty, setAcDirty] = useState(false);
  const [newBlocker, setNewBlocker] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  return (
    <div>
      <h1 className="mt-1 text-2xl font-semibold">{ticket.title}</h1>
      {ticket.sourceSection && (
        <p className="mt-1 text-xs text-zinc-500">
          Traces to: <span className="font-medium">{ticket.sourceSection}</span>
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
        <label>
          Status:{" "}
          <select
            value={ticket.status}
            onChange={(e) => run(() => setTicketStatus(ticket.id, e.target.value))}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-2 py-1"
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority:{" "}
          <select
            value={ticket.priority}
            onChange={(e) => run(() => updateTicket(ticket.id, { priority: e.target.value }))}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-2 py-1"
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Points:{" "}
          <input
            type="number"
            min={1}
            max={13}
            defaultValue={ticket.estimate ?? ""}
            onBlur={(e) =>
              run(() =>
                updateTicket(ticket.id, {
                  estimate: e.target.value ? Number(e.target.value) : null,
                })
              )
            }
            className="w-16 rounded-md border border-zinc-300 px-2 py-1"
          />
        </label>
        <label>
          Sprint:{" "}
          <select
            value={ticket.sprintId ?? ""}
            onChange={(e) =>
              run(() => assignTicketToSprint(ticket.id, e.target.value || null))
            }
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-2 py-1"
          >
            <option value="">— backlog —</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ticket.description && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium">Description</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
            {ticket.description}
          </p>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Acceptance criteria</p>
          <button
            onClick={() =>
              run(async () => {
                await updateTicket(ticket.id, { acceptanceCriteria: ac });
                setAcDirty(false);
              })
            }
            disabled={!acDirty || isPending}
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            {acDirty ? "Save" : "Saved"}
          </button>
        </div>
        <textarea
          value={ac}
          onChange={(e) => {
            setAc(e.target.value);
            setAcDirty(true);
          }}
          rows={6}
          className="mt-2 w-full rounded-md border border-zinc-200 p-2 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Markdown checklist — each &quot;- [ ]&quot; line is a testable done-condition.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium">Blocked by</p>
          <ul className="mt-2 space-y-1.5">
            {blockedBy.length === 0 && (
              <li className="text-xs text-zinc-500">Nothing — free to start.</li>
            )}
            {blockedBy.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-sm">
                <StatusBadge status={b.status} />
                <Link
                  href={`/projects/${projectId}/tickets/${b.id}`}
                  className="flex-1 truncate hover:underline"
                >
                  {b.title}
                </Link>
                <button
                  onClick={() => run(() => removeDependency(ticket.id, b.id))}
                  className="text-xs text-zinc-400 hover:text-red-600"
                  title="Remove dependency"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <select
              value={newBlocker}
              onChange={(e) => setNewBlocker(e.target.value)}
              className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm"
            >
              <option value="">Add a blocker…</option>
              {otherTickets
                .filter((t) => !blockedBy.some((b) => b.id === t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </select>
            <button
              onClick={() =>
                newBlocker &&
                run(async () => {
                  await addDependency(ticket.id, newBlocker);
                  setNewBlocker("");
                })
              }
              disabled={!newBlocker || isPending}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium">Blocks</p>
          <ul className="mt-2 space-y-1.5">
            {blocks.length === 0 && (
              <li className="text-xs text-zinc-500">Nothing depends on this ticket.</li>
            )}
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-sm">
                <StatusBadge status={b.status} />
                <Link
                  href={`/projects/${projectId}/tickets/${b.id}`}
                  className="flex-1 truncate hover:underline"
                >
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
