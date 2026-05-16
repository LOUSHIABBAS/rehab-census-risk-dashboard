import { prisma } from "@/lib/db/client";
import type { OpenRiskFlagRow } from "@/lib/db/queries/riskFlags";

export type PatientRow = Awaited<ReturnType<typeof listPatients>>[number];

export type PatientForUrNote = {
  patient: {
    id: string;
    facilityId: string;
    admissionDate: Date;
    levelOfCare: string;
    primaryDiagnosisCode: string;
    insurancePayer: string;
  };
  facility: { id: string; name: string };
  flags: OpenRiskFlagRow[];
};

export async function getPatientForUrNote(patientId: string): Promise<PatientForUrNote | null> {
  // Minimum-necessary select: only fields required for UR note de-identification.
  // No name, DOB, MRN, SSN, address, or phone fields are selected.
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      facilityId: true,
      admissionDate: true,
      levelOfCare: true,
      primaryDiagnosisCode: true,
      insurancePayer: true,
      facility: { select: { id: true, name: true } },
      riskFlags: {
        where: { resolved: false },
        include: {
          patient: {
            select: {
              id: true,
              facilityId: true,
              facility: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!patient) return null;

  return {
    patient: {
      id: patient.id,
      facilityId: patient.facilityId,
      admissionDate: patient.admissionDate,
      levelOfCare: patient.levelOfCare,
      primaryDiagnosisCode: patient.primaryDiagnosisCode,
      insurancePayer: patient.insurancePayer,
    },
    facility: patient.facility,
    flags: patient.riskFlags as OpenRiskFlagRow[],
  };
}

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
