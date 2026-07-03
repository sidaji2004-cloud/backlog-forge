"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ProjectLink = { id: string; name: string };

export function Sidebar({ projects }: { projects: ProjectLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      <p className="px-2 pt-1 pb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
        Projects
      </p>
      {projects.length === 0 && (
        <p className="px-2 text-sm text-zinc-500">No projects yet.</p>
      )}
      {projects.map((p) => {
        const active =
          pathname === `/projects/${p.id}` ||
          pathname.startsWith(`/projects/${p.id}/`);
        return (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            aria-current={active ? "page" : undefined}
            className={`block rounded-md px-2 py-1.5 text-sm ${
              active
                ? "bg-zinc-900 font-medium text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {p.name}
          </Link>
        );
      })}
    </nav>
  );
}
