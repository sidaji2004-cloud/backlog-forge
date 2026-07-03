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
import { useRotatingHint } from "@/components/useRotatingHint";

const BRD_HINTS = [
  "Reading your idea…",
  "Sketching the business context…",
  "Drafting objectives and success metrics…",
  "Polishing the wording…",
] as const;

const PRD_HINTS = [
  "Re-reading the approved BRD…",
  "Turning goals into features and user stories…",
  "Setting priorities and scope…",
  "Polishing the wording…",
] as const;

const FSD_HINTS = [
  "Re-reading the approved PRD…",
  "Mapping features to screens and flows…",
  "Adding rules and edge cases…",
  "Tagging anchors for traceability…",
] as const;

const QUESTIONS_HINTS = [
  "Reading your idea…",
  "Finding the fuzzy bits…",
  "Writing a few sharp questions…",
] as const;

const TICKETS_HINTS = [
  "Re-reading the PRD and FSD…",
  "Breaking behavior into tickets…",
  "Assigning priorities and estimates…",
  "Wiring up dependencies…",
] as const;

function docHintsFor(type: DocType): readonly string[] {
  if (type === "BRD") return BRD_HINTS;
  if (type === "PRD") return PRD_HINTS;
  return FSD_HINTS;
}

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
  const [phase, setPhase] = useState<"questions" | "doc">("doc");

  // Only a project's very first BRD gets the optional clarifying-question
  // detour — regenerating, and PRD/FSD, stay single-click as before.
  const usesClarifyingStep = type === "BRD" && !hasExisting;

  const hints = phase === "questions" ? QUESTIONS_HINTS : docHintsFor(type);
  const hint = useRotatingHint(hints, isPending);

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
      setPhase("doc");
      startTransition(() => doGenerate());
      return;
    }
    setPhase("questions");
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
      setPhase("doc");
      await doGenerate();
    });
  };

  if (questions) {
    return (
      <ClarifyingQuestionsPanel
        questions={questions}
        onSkip={() => {
          setQuestions(null);
          setPhase("doc");
          startTransition(() => doGenerate());
        }}
        onContinue={(answers) => {
          setQuestions(null);
          setPhase("doc");
          startTransition(() => doGenerate(answers));
        }}
      />
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
      >
        {isPending
          ? phase === "questions"
            ? "Thinking of questions…"
            : "Generating…"
          : hasExisting
            ? "✦ Regenerate with AI"
            : "✦ Generate with AI"}
      </button>
      {isPending && hint && (
        <p className="px-1 text-xs italic text-violet-600">{hint}</p>
      )}
    </div>
  );
}

export function GenerateTicketsButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [proposed, setProposed] = useState<GeneratedTicket[] | null>(null);
  const hint = useRotatingHint(TICKETS_HINTS, isPending);

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
    <div className="flex flex-col gap-1">
      <button
        onClick={generate}
        disabled={isPending}
        className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
      >
        {isPending ? "Generating tickets…" : "✦ Generate tickets from PRD"}
      </button>
      {isPending && hint && (
        <p className="px-1 text-xs italic text-violet-600">{hint}</p>
      )}
    </div>
  );
}
