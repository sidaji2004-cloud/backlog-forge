"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  updateDocumentContent,
  setDocumentStatus,
  createNewVersion,
} from "@/lib/actions";
import { DOC_STATUSES } from "@/lib/templates";
import { StatusBadge } from "@/components/StatusBadge";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Loads client-side only — the editor touches the DOM directly and has no
// server-render path.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function DocumentEditor({
  documentId,
  initialContent,
  status,
  version,
  olderVersions,
}: {
  documentId: string;
  initialContent: string;
  status: string;
  version: number;
  olderVersions: number;
}) {
  const [content, setContent] = useState(initialContent);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      await updateDocumentContent(documentId, content);
      setDirty(false);
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2">
        <span className="text-sm text-zinc-500">
          v{version}
          {olderVersions > 0 && ` (${olderVersions} older)`}
        </span>
        <StatusBadge status={status} />
        <select
          value={status}
          onChange={(e) =>
            startTransition(() => setDocumentStatus(documentId, e.target.value))
          }
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        >
          {DOC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() =>
              startTransition(() => createNewVersion(documentId))
            }
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            title="Snapshot this version and start a new draft"
          >
            New version
          </button>
          <button
            onClick={save}
            disabled={!dirty || isPending}
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
          >
            {isPending ? "Saving…" : dirty ? "Save" : "Saved"}
          </button>
        </div>
      </div>

      <div data-color-mode="light" className="mt-4">
        <MDEditor
          value={content}
          onChange={(value) => {
            setContent(value ?? "");
            setDirty(true);
          }}
          height="65vh"
          preview="live"
        />
      </div>
    </div>
  );
}
