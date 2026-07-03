"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveReviewedTicketsAction } from "@/lib/generation-actions";
import { TICKET_PRIORITIES } from "@/lib/templates";
import { StatusBadge } from "@/components/StatusBadge";
import type { GeneratedTicket } from "@/lib/ai";

type ReviewItem = GeneratedTicket & { selected: boolean };

export function TicketReviewPanel({
  projectId,
  tickets,
  onRegenerate,
  onCancel,
  onDone,
}: {
  projectId: string;
  tickets: GeneratedTicket[];
  onRegenerate: () => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [items, setItems] = useState<ReviewItem[]>(
    tickets.map((t) => ({ ...t, selected: true }))
  );
  const [isSaving, startSaving] = useTransition();

  const selectedCount = items.filter((i) => i.selected).length;

  // How many currently-selected tickets depend on ticket i (for the
  // informational "required by N" hint — never blocks deselection).
  const requiredByCount = (index: number) =>
    items.filter((i) => i.selected && i.dependsOn.includes(index)).length;

  const toggle = (index: number) =>
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it))
    );

  const setPriority = (index: number, priority: GeneratedTicket["priority"]) =>
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, priority } : it))
    );

  const confirmSave = () => {
    const reviewed = items.map((it): GeneratedTicket | null => {
      if (!it.selected) return null;
      const { selected: _selected, ...ticket } = it;
      return ticket;
    });
    startSaving(async () => {
      const promise = saveReviewedTicketsAction(projectId, reviewed);
      toast.promise(promise, {
        loading: "Saving tickets…",
        success: (count) => `Saved ${count} ticket(s).`,
        error: (e) => (e instanceof Error ? e.message : "Something went wrong."),
      });
      try {
        await promise;
        onDone();
      } catch {
        // stay in the review panel so the user can retry without regenerating
      }
    });
  };

  return (
    <div className="mt-6 w-full rounded-lg border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-violet-900">
          Review generated tickets — nothing is saved yet
        </p>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setItems((prev) => prev.map((it) => ({ ...it, selected: true })))}
            className="text-zinc-500 hover:underline"
          >
            Select all
          </button>
          <button
            onClick={() => setItems((prev) => prev.map((it) => ({ ...it, selected: false })))}
            className="text-zinc-500 hover:underline"
          >
            Deselect all
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((t, i) => {
          const requiredBy = requiredByCount(i);
          return (
            <div
              key={i}
              className={`rounded-md border bg-white p-3 text-sm ${
                t.selected ? "border-zinc-200" : "border-zinc-100 opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={t.selected}
                  onChange={() => toggle(i)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium leading-snug">{t.title}</p>
                  {t.description && (
                    <p className="mt-1 text-xs text-zinc-600">{t.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <select
                      value={t.priority}
                      onChange={(e) =>
                        setPriority(i, e.target.value as GeneratedTicket["priority"])
                      }
                      disabled={!t.selected}
                      className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs"
                    >
                      {TICKET_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <StatusBadge status={t.priority} />
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                      {t.estimate} pt
                    </span>
                    {t.selected && requiredBy > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Required by {requiredBy} other ticket{requiredBy > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={confirmSave}
          disabled={selectedCount === 0 || isSaving}
          className="rounded-md border border-violet-300 bg-violet-100 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-200 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : `Confirm & save ${selectedCount} ticket(s)`}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isSaving}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          Regenerate
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <span className="text-xs text-zinc-500">
          {selectedCount} of {items.length} selected
        </span>
      </div>
    </div>
  );
}
