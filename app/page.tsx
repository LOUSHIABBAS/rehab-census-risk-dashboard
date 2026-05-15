export const dynamic = "force-dynamic";

import { getDashboardStats, getFacilityCensus } from "@/lib/db/queries/facilities";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FacilityCard } from "@/components/dashboard/FacilityCard";
import { OccupancyChart } from "@/components/charts/OccupancyChart";

export default async function Home() {
  const [stats, census] = await Promise.all([
    getDashboardStats(),
    getFacilityCensus(),
  ]);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rehab Census &amp; Risk Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Synthetic data — no real PHI. Built with Claude Code.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Facilities" value={stats.totalFacilities} />
        <KpiCard label="Admitted Patients" value={stats.totalAdmitted} />
        <KpiCard
          label="Open Risk Flags"
          value={stats.openRiskFlagCount}
          subtle="unresolved"
        />
        <KpiCard
          label="Avg Occupancy"
          value={`${stats.avgOccupancyPct}%`}
          subtle="across all facilities"
        />
      </div>

      {/* Facility cards + chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 content-start">
          {census.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
        <OccupancyChart data={census} />
      </div>
    </main>
  );
}
