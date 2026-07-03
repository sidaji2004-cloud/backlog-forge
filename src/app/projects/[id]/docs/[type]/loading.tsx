import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-8 w-72" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
        <Skeleton className="h-[65vh] w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
