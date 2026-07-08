import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-40" />

      <Skeleton className="h-12 w-full rounded-pill" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-pill" />
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-pill" />
          <Skeleton className="h-9 w-28 rounded-pill" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-card border border-border bg-surface p-5"
          >
            <Skeleton className="mb-3 h-6 w-20 rounded-pill" />
            <Skeleton className="h-5 w-3/4" />
            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-pill" />
              <Skeleton className="h-5 w-16 rounded-pill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
