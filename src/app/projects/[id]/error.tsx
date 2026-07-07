"use client";

import { useEffect } from "react";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged client-side so it's visible in the browser console even though
    // the server hides the real message in production builds.
    console.error("Project page error:", error);
  }, [error]);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-2xl">⚠️</p>
      <h1 className="mt-2 text-lg font-semibold text-zinc-900">
        Something went wrong loading this page
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        This is usually a brief hiccup — most often the database taking a
        moment to respond. Your data is safe; nothing was lost.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-zinc-400">
          Reference code: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Try again
      </button>
    </div>
  );
}
