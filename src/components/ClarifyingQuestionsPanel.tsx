"use client";

import { useState } from "react";

export function ClarifyingQuestionsPanel({
  questions,
  onSkip,
  onContinue,
}: {
  questions: string[];
  onSkip: () => void;
  onContinue: (answers: string) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));

  const submit = () => {
    const text = questions
      .map((q, i) =>
        answers[i]?.trim() ? `Q: ${q}\nA: ${answers[i].trim()}` : null
      )
      .filter((line): line is string => line !== null)
      .join("\n\n");
    onContinue(text);
  };

  return (
    <div className="space-y-3 rounded-md border border-violet-200 bg-violet-50/50 p-3">
      <p className="text-xs font-medium text-violet-800">
        A few quick questions before writing the BRD (optional):
      </p>
      {questions.map((q, i) => (
        <div key={i}>
          <label className="block text-xs text-zinc-600">{q}</label>
          <input
            value={answers[i]}
            onChange={(e) =>
              setAnswers((prev) =>
                prev.map((a, idx) => (idx === i ? e.target.value : a))
              )
            }
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button
          onClick={submit}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Continue & generate BRD
        </button>
        <button
          onClick={onSkip}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
