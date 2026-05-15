import { prisma } from "@/lib/db/client";

export type FacilityCensusRow = Awaited<ReturnType<typeof getFacilityCensus>>[number];

export async function getFacilityCensus() {
  const facilities = await prisma.facility.findMany({
    select: {
      id: true,
      name: true,
      capacity: true,
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
    capacity: f.capacity,
    admittedCount: f._count.patients,
    occupancyPct: f.capacity > 0 ? Math.round((f._count.patients / f.capacity) * 100) : 0,
  }));
}
