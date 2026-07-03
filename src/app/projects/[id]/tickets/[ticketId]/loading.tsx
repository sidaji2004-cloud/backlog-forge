import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-8 w-64" />
      <Skeleton className="mt-4 h-10 w-full" />
      <Skeleton className="mt-4 h-24 w-full" />
      <Skeleton className="mt-4 h-40 w-full" />
    </div>
  );
}
