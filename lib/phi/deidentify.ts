import type { FacilityCensusRow } from "@/lib/db/queries/facilities";
import type { OpenRiskFlagRow } from "@/lib/db/queries/riskFlags";

// Auditable ICD-10 → diagnosis bucket mapping.
// Only these codes are accepted; anything else maps to the catch-all.
// Never send raw ICD-10 codes to Bedrock.
const DIAGNOSIS_BUCKETS: Record<string, string> = {
  "F10.20": "Alcohol Use Disorder, Moderate",
  "F11.20": "Opioid Use Disorder, Moderate",
  "F12.20": "Cannabis Use Disorder, Moderate",
  "F14.20": "Cocaine Use Disorder, Moderate",
  "F15.20": "Stimulant Use Disorder (other), Moderate",
  "F19.20": "Other Psychoactive Substance Use Disorder, Moderate",
};

function mapDiagnosisCode(icd10: string): string {
  return DIAGNOSIS_BUCKETS[icd10] ?? "Substance Use Disorder, Moderate";
}

export type SafeUrPayload = {
  patientToken: string;
  facilityName: string;
  levelOfCare: string;
  daysInTreatment: number;
  diagnosisCategory: string;
  insurancePayer: string;
  activeFlags: Array<{ flagType: string; severity: string; daysOpen: number }>;
};

export type FlagType = "ama_risk" | "auth_lapse" | "missed_groups" | "failed_ua" | "no_aftercare";
export type FlagSeverity = "high" | "medium" | "low";

export type SafeBriefingPayload = {
  facilities: Array<{
    name: string;
    levelOfCare: string;
    capacity: number;
    admittedCount: number;
    occupancyPct: number;
  }>;
  flagsByType: Record<FlagType, number>;
  flagsBySeverity: Record<FlagSeverity, number>;
  flagsByFacility: Record<string, number>; // keyed by facility name, not ID
  authLapsesNext7Days: number;
  totalAdmitted: number;
};

export function buildUrNotePayload(input: {
  patient: {
    id: string;
    facilityId: string;
    admissionDate: Date | string;
    levelOfCare: string;
    primaryDiagnosisCode: string;
    insurancePayer: string;
  };
  facility: { id: string; name: string };
  flags: OpenRiskFlagRow[];
}): SafeUrPayload {
  const { patient, facility, flags } = input;

  // Compute days in treatment server-side; never send the raw admission date.
  const admissionMs = new Date(patient.admissionDate).getTime();
  const daysInTreatment = Math.max(1, Math.floor((Date.now() - admissionMs) / (1000 * 60 * 60 * 24)));

  return {
    patientToken: patient.id.slice(0, 12),
    facilityName: facility.name,
    levelOfCare: patient.levelOfCare,
    daysInTreatment,
    diagnosisCategory: mapDiagnosisCode(patient.primaryDiagnosisCode),
    insurancePayer: patient.insurancePayer,
    activeFlags: flags.map((f) => ({
      flagType: f.flagType,
      severity: f.severity,
      daysOpen: Math.max(1, Math.floor((Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24))),
    })),
  };
}

export function buildDailyBriefingPayload(
  census: FacilityCensusRow[],
  flags: OpenRiskFlagRow[]
): SafeBriefingPayload {
  // Whitelist-only projection: only extract the explicitly allowed fields.
  // Patient IDs and individual patient records never enter the payload.
  const facilities = census.map((f) => ({
    name: f.name,
    levelOfCare: f.levelOfCare,
    capacity: f.capacity,
    admittedCount: f.admittedCount,
    occupancyPct: f.occupancyPct,
  }));

  const totalAdmitted = facilities.reduce((s, f) => s + f.admittedCount, 0);

  const flagsByType: Record<FlagType, number> = {
    ama_risk: 0,
    auth_lapse: 0,
    missed_groups: 0,
    failed_ua: 0,
    no_aftercare: 0,
  };
  const flagsBySeverity: Record<FlagSeverity, number> = { high: 0, medium: 0, low: 0 };
  const flagsByFacility: Record<string, number> = {};

  for (const flag of flags) {
    const ft = flag.flagType as FlagType;
    if (ft in flagsByType) flagsByType[ft]++;

    const sev = flag.severity as FlagSeverity;
    if (sev in flagsBySeverity) flagsBySeverity[sev]++;

    // Use facility name (not ID) as the key
    const facilityName = flag.patient.facility.name;
    flagsByFacility[facilityName] = (flagsByFacility[facilityName] ?? 0) + 1;
  }

  // auth_lapse flags are treated as imminent authorization expirations
  const authLapsesNext7Days = flagsByType.auth_lapse;

  return {
    facilities,
    flagsByType,
    flagsBySeverity,
    flagsByFacility,
    authLapsesNext7Days,
    totalAdmitted,
  };
}
