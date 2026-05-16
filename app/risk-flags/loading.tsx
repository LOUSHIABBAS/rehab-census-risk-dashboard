import { Skeleton } from "@/components/ui/skeleton";

export default function RiskFlagsLoading() {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>

      {/* Filter skeletons */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-80" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 flex gap-8">
          {["w-24", "w-36", "w-28", "w-32", "w-20", "w-16"].map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex gap-8 items-center animate-pulse">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28 font-mono" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground animate-pulse">
        Warming up the database… this can take up to a minute on first visit. Azure SQL Serverless
        auto-pauses to save resources.
      </p>
    </main>
  );
}
