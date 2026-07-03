import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800">
      <span>👀</span>
      <span>
        This is a <strong>read-only demo project</strong>. Editing, generation
        and status changes are disabled.
      </span>
      <Link
        href="/projects/new"
        className="ml-auto rounded-md bg-violet-900 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
      >
        Create your own →
      </Link>
    </div>
  );
}
