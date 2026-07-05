"use client";

import { useId } from "react";
import { HELP, type HelpTerm } from "@/lib/help-text";

/**
 * A subtle "?" icon that reveals a contextual explanation on hover or
 * keyboard-focus. The copy lives in `src/lib/help-text.ts` — every jargon
 * term in the app is keyed there so a copy edit is a one-file change.
 *
 * Accessibility:
 * - Rendered as a real <button> so keyboard users can Tab to it.
 * - Tooltip shows via CSS on `:hover` AND `:focus-within`, so it works
 *   for touch (tap-to-focus, tap-outside-to-blur) with no JS state.
 * - The tooltip is announced via aria-describedby.
 */
export function HelpTip({
  term,
  align = "left",
  size = "sm",
}: {
  term: HelpTerm;
  align?: "left" | "right";
  size?: "sm" | "md";
}) {
  const id = useId();
  const entry = HELP[term];
  if (!entry) return null;

  const iconSize = size === "md" ? "h-5 w-5 text-xs" : "h-4 w-4 text-[10px]";
  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-describedby={id}
        aria-label={`Help: ${entry.title}`}
        className={`inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white font-semibold text-zinc-500 hover:border-violet-400 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 ${iconSize}`}
      >
        ?
      </button>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-2 w-72 rounded-md border border-zinc-200 bg-white p-3 text-left text-xs leading-relaxed text-zinc-700 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${alignClass}`}
      >
        <span className="mb-1 block text-sm font-semibold text-zinc-900">
          {entry.title}
        </span>
        <span className="block">{entry.body}</span>
      </span>
    </span>
  );
}
