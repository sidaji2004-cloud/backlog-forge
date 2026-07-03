import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-full max-w-md" />
      <div className="mt-6 space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3 w-48" />
            <Skeleton className="mt-3 h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
