import type { FacilityCensusRow } from "@/lib/db/queries/facilities";
import type { OpenRiskFlagRow } from "@/lib/db/queries/riskFlags";

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
