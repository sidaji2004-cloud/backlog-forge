"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  generateDocAction,
  generateTicketsAction,
  getClarifyingQuestionsAction,
} from "@/lib/generation-actions";
import type { DocType } from "@/lib/templates";
import { ClarifyingQuestionsPanel } from "@/components/ClarifyingQuestionsPanel";
import { TicketReviewPanel } from "@/components/TicketReviewPanel";
import type { GeneratedTicket } from "@/lib/ai";

function useGenerateAction(loadingMessage: string, successMessage: string) {
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      const promise = fn();
      toast.promise(promise, {
        loading: loadingMessage,
        success: successMessage,
        error: (e) => (e instanceof Error ? e.message : "Something went wrong."),
      });
      try {
        await promise;
      } catch {
        // already surfaced via the toast above
      }
    });
  return { isPending, run };
}

export function GenerateDocButton({
  projectId,
  type,
  hasExisting,
}: {
  projectId: string;
  type: DocType;
  hasExisting: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [questions, setQuestions] = useState<string[] | null>(null);

  // Only a project's very first BRD gets the optional clarifying-question
  // detour — regenerating, and PRD/FSD, stay single-click as before.
  const usesClarifyingStep = type === "BRD" && !hasExisting;

  async function doGenerate(answers?: string) {
    const promise = generateDocAction(projectId, type, answers);
    toast.promise(promise, {
      loading: "Asking Gemini to write this document…",
      success: "Document generated.",
      error: (e) => (e instanceof Error ? e.message : "Something went wrong."),
    });
    try {
      await promise;
    } catch {
      // already surfaced via the toast above
    }
  }

  const handleClick = () => {
    setQuestions(null);
    if (!usesClarifyingStep) {
      startTransition(() => doGenerate());
      return;
    }
    startTransition(async () => {
      try {
        const qs = await getClarifyingQuestionsAction(projectId);
        if (qs.length > 0) {
          setQuestions(qs);
          return;
        }
      } catch {
        // if the question fetch itself fails, don't block the BRD
      }
      await doGenerate();
    });
  };

  if (questions) {
    return (
      <ClarifyingQuestionsPanel
        questions={questions}
        onSkip={() => {
          setQuestions(null);
          startTransition(() => doGenerate());
        }}
        onContinue={(answers) => {
          setQuestions(null);
          startTransition(() => doGenerate(answers));
        }}
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
    >
      {isPending
        ? usesClarifyingStep
          ? "Thinking of questions…"
          : "Generating…"
        : hasExisting
          ? "✦ Regenerate with AI"
          : "✦ Generate with AI"}
    </button>
  );
}

export function GenerateTicketsButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [proposed, setProposed] = useState<GeneratedTicket[] | null>(null);

  const generate = () => {
    startTransition(async () => {
      const promise = generateTicketsAction(projectId);
      toast.promise(promise, {
        loading: "Asking Gemini to break the PRD into tickets…",
        success: "Tickets generated — review below.",
        error: (e) => (e instanceof Error ? e.message : "Something went wrong."),
      });
      try {
        setProposed(await promise);
      } catch {
        // already surfaced via the toast above
      }
    });
  };

  if (proposed) {
    return (
      <TicketReviewPanel
        projectId={projectId}
        tickets={proposed}
        onRegenerate={generate}
        onCancel={() => setProposed(null)}
        onDone={() => setProposed(null)}
      />
    );
  }

  return (
    <button
      onClick={generate}
      disabled={isPending}
      className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
    >
      {isPending ? "Generating tickets…" : "✦ Generate tickets from PRD"}
    </button>
  );
}
