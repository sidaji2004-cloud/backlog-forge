const COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  backlog: "bg-zinc-100 text-zinc-700",
  todo: "bg-blue-100 text-blue-800",
  "in-progress": "bg-amber-100 text-amber-800",
  done: "bg-green-100 text-green-800",
  low: "bg-zinc-100 text-zinc-700",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        COLORS[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {status}
    </span>
  );
}
