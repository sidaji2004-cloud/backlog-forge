"use client";

// Last-resort safety net for the whole app: catches anything that crashes
// above the per-project error boundary (e.g. the root layout itself). Must
// render its own <html>/<body> since it replaces the entire document.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-2xl">⚠️</p>
          <h1 className="mt-2 text-lg font-semibold text-zinc-900">
            Something went wrong
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
      </body>
    </html>
  );
}
