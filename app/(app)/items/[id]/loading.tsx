import { Skeleton } from "@/components/ui/skeleton";

export default function ItemDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-9 w-36 rounded-pill" />

      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="h-6 w-20 rounded-pill" />
        <Skeleton className="h-9 w-2/3" />
      </div>

      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-pill" />
        <Skeleton className="h-5 w-16 rounded-pill" />
      </div>

      <Skeleton className="mt-6 h-64 w-full rounded-card border border-border bg-surface" />
    </div>
  );
}
