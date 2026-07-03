"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import type { ProjectLink } from "@/components/Sidebar";

const itemClass =
  "cursor-pointer rounded-md px-2 py-1.5 text-sm text-zinc-900 data-[selected=true]:bg-zinc-100";
const groupClass =
  "px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-zinc-400 first:pt-1 [&_[cmdk-group-items]]:mt-1";

export function CommandPalette({ projects }: { projects: ProjectLink[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const currentProjectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Quick switcher"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
        <Command.Input
          autoFocus
          placeholder="Jump to a project or page…"
          className="w-full border-b border-zinc-200 px-4 py-3 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-2 py-4 text-center text-sm text-zinc-500">
            No matches.
          </Command.Empty>

          {currentProject && (
            <Command.Group heading={currentProject.name} className={groupClass}>
              <Command.Item
                onSelect={() => go(`/projects/${currentProject.id}`)}
                className={itemClass}
              >
                Overview
              </Command.Item>
              <Command.Item
                onSelect={() => go(`/projects/${currentProject.id}/board`)}
                className={itemClass}
              >
                Ticket board
              </Command.Item>
              <Command.Item
                onSelect={() => go(`/projects/${currentProject.id}/sprints`)}
                className={itemClass}
              >
                Sprints
              </Command.Item>
              {(["BRD", "PRD", "FSD"] as const).map((type) => (
                <Command.Item
                  key={type}
                  onSelect={() => go(`/projects/${currentProject.id}/docs/${type}`)}
                  className={itemClass}
                >
                  {type} document
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="All projects" className={groupClass}>
            {projects.map((p) => (
              <Command.Item
                key={p.id}
                onSelect={() => go(`/projects/${p.id}`)}
                className={itemClass}
              >
                {p.name}
              </Command.Item>
            ))}
            <Command.Item onSelect={() => go("/projects/new")} className={itemClass}>
              + New project
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
