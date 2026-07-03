import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-8 w-40" />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((col) => (
          <div key={col} className="rounded-lg bg-zinc-100 p-3">
            <Skeleton className="h-4 w-16" />
            <div className="mt-2 space-y-2">
              {[0, 1].map((card) => (
                <div key={card} className="rounded-md border border-zinc-200 bg-white p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
