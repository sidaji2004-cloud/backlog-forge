"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { exportTicketsCsv, type CsvFormat } from "@/lib/csv-actions";

const FORMAT_LABELS: Record<CsvFormat, string> = {
  generic: "Generic",
  jira: "Jira",
  linear: "Linear",
};

export function ExportCsvButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [format, setFormat] = useState<CsvFormat>("generic");
  const [isPending, startTransition] = useTransition();

  const handleExport = () =>
    startTransition(async () => {
      try {
        const csv = await exportTicketsCsv(projectId, format);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-tickets-${format}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported in ${FORMAT_LABELS[format]} format.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Export failed.");
      }
    });

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as CsvFormat)}
        className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
        aria-label="Export format"
      >
        {(Object.keys(FORMAT_LABELS) as CsvFormat[]).map((f) => (
          <option key={f} value={f}>
            {FORMAT_LABELS[f]}
          </option>
        ))}
      </select>
      <button
        onClick={handleExport}
        disabled={isPending}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
      >
        {isPending ? "Exporting…" : "⬇ Export as CSV"}
      </button>
    </div>
  );
}
