import { prisma } from "@/lib/db/client";
import { listOpenRiskFlags } from "@/lib/db/queries/riskFlags";

export async function listFacilities(): Promise<{ id: string; name: string }[]> {
  return prisma.facility.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export type FacilityCensusRow = Awaited<ReturnType<typeof getFacilityCensus>>[number];
export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getFacilityCensus() {
  const facilities = await prisma.facility.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      capacity: true,
      levelOfCare: true,
      _count: {
        select: {
          patients: {
            where: { dischargeDate: null },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return facilities.map((f) => ({
    id: f.id,
    name: f.name,
    address: f.address,
    capacity: f.capacity,
    levelOfCare: f.levelOfCare,
    admittedCount: f._count.patients,
    occupancyPct: f.capacity > 0 ? Math.round((f._count.patients / f.capacity) * 100) : 0,
  }));
}

export async function getDashboardStats(): Promise<{
  totalFacilities: number;
  totalAdmitted: number;
  openRiskFlagCount: number;
  avgOccupancyPct: number;
}> {
  const [census, openFlags] = await Promise.all([
    getFacilityCensus(),
    listOpenRiskFlags(),
  ]);

  const totalAdmitted = census.reduce((s, f) => s + f.admittedCount, 0);
  const avgOccupancyPct =
    census.length > 0
      ? Math.round(census.reduce((s, f) => s + f.occupancyPct, 0) / census.length)
      : 0;

  return {
    totalFacilities: census.length,
    totalAdmitted,
    openRiskFlagCount: openFlags.length,
    avgOccupancyPct,
  };
}
