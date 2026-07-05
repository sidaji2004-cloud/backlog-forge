"use client";

import { useEffect, useState } from "react";

const KEY = "backlogforge-help-hint-dismissed";

export function HelpHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(KEY) !== "1") setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem(KEY, "1");
    setVisible(false);
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-violet-300 bg-white text-xs font-semibold">
        ?
      </span>
      <span>New here? Hover any <strong>?</strong> icon for a plain-English explanation of the term next to it.</span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
      >
        Dismiss
      </button>
    </div>
  );
}
