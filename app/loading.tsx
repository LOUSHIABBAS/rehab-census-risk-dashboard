import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

function FacilitySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      {/* Facility cards + chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 content-start">
          <FacilitySkeleton />
          <FacilitySkeleton />
          <FacilitySkeleton />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground animate-pulse">
        Warming up the database… this can take up to a minute on first visit.
        Azure SQL Serverless auto-pauses to save resources.
      </p>
    </main>
  );
}
