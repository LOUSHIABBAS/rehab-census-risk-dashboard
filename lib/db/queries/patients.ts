import { prisma } from "@/lib/db/client";

export type PatientRow = Awaited<ReturnType<typeof listPatients>>[number];

export async function listPatients(facilityId?: string) {
  return prisma.patient.findMany({
    where: {
      dischargeDate: null,
      ...(facilityId ? { facilityId } : {}),
    },
    orderBy: { admissionDate: "desc" },
    take: 100,
  });
}
