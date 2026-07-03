"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { autoPackSprintAction } from "@/lib/ticket-actions";

export function AutoPackButton({ sprintId }: { sprintId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () =>
    startTransition(async () => {
      const promise = autoPackSprintAction(sprintId);
      toast.promise(promise, {
        loading: "Packing the sprint…",
        success: (count) => `Packed ${count} ticket(s) into the sprint.`,
        error: (e) => (e instanceof Error ? e.message : "Couldn't auto-pack this sprint."),
      });
      try {
        await promise;
      } catch {
        // already surfaced via the toast above
      }
    });

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
    >
      {isPending ? "Packing…" : "⚡ Auto-pack"}
    </button>
  );
}
