import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />

      <Skeleton className="mt-8 h-6 w-32" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-3/4" />
            <Skeleton className="mt-4 h-8 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-10 h-6 w-32" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
