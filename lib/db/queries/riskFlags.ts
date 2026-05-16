import { prisma } from "@/lib/db/client";

export type OpenRiskFlagRow = Awaited<ReturnType<typeof listOpenRiskFlags>>[number];

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export async function listOpenRiskFlags(facilityId?: string) {
  const flags = await prisma.riskFlag.findMany({
    where: {
      resolved: false,
      ...(facilityId ? { patient: { facilityId } } : {}),
    },
    include: {
      patient: {
        select: {
          id: true,
          facilityId: true,
          facility: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  // Sort high → medium → low, then by createdAt desc (already sorted above as tiebreaker)
  return flags.sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] ?? 3;
    const sb = SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER] ?? 3;
    return sa - sb;
  });
}
