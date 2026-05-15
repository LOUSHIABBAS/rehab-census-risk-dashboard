import { faker } from "@faker-js/faker";
import {
  EncounterTypeSchema,
  FlagSeveritySchema,
  FlagTypeSchema,
  LevelOfCare,
  LevelOfCareSchema,
} from "@/lib/schemas/enums";
import { newId } from "@/lib/db/ids";

// --- Domain types (no PHI fields) ---

export type SeedFacility = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  levelOfCare: LevelOfCare;
  createdAt: string;
};

export type SeedPatient = {
  id: string;
  facilityId: string;
  admissionDate: string;
  dischargeDate: string | null;
  levelOfCare: LevelOfCare;
  primaryDiagnosisCode: string;
  insurancePayer: string;
  insuranceAuthExpiresAt: string | null;
  createdAt: string;
};

export type SeedEncounter = {
  id: string;
  patientId: string;
  encounterDate: string;
  encounterType: string;
  attended: boolean;
  notes: null;
  createdAt: string;
};

export type SeedRiskFlag = {
  id: string;
  patientId: string;
  flagType: string;
  severity: string;
  resolved: false;
  createdAt: string;
  resolvedAt: null;
};

export type SyntheticData = {
  facilities: SeedFacility[];
  patients: SeedPatient[];
  encounters: SeedEncounter[];
  riskFlags: SeedRiskFlag[];
};

// --- Helpers ---

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = faker.number.float({ min: 0, max: total });
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

const NOW = new Date();

// --- Generators ---

export function generateFacilities(): SeedFacility[] {
  const ts = NOW.toISOString();
  return [
    {
      id: newId("facility"),
      name: "Lakewood Recovery Center",
      address: `${faker.number.int({ min: 100, max: 9999 })} Detroit Ave, Cleveland, OH 44107`,
      capacity: 48,
      levelOfCare: "residential",
      createdAt: ts,
    },
    {
      id: newId("facility"),
      name: "Maple Heights Detox & PHP",
      address: `${faker.number.int({ min: 100, max: 9999 })} Libby Rd, Maple Heights, OH 44137`,
      capacity: 32,
      levelOfCare: "detox",
      createdAt: ts,
    },
    {
      id: newId("facility"),
      name: "Eastside Outpatient",
      address: `${faker.number.int({ min: 100, max: 9999 })} Market St, Akron, OH 44302`,
      capacity: 80,
      levelOfCare: "iop",
      createdAt: ts,
    },
  ];
}

const DIAGNOSIS_CODES = ["F10.20", "F11.20", "F12.20", "F14.20", "F15.20", "F19.20"];
const DIAGNOSIS_WEIGHTS = [35, 30, 10, 10, 8, 7];

const PAYERS = ["Medicaid", "Medicare", "Aetna", "BCBS", "Cigna", "UnitedHealthcare", "Self-Pay"];
const PAYER_WEIGHTS = [45, 15, 10, 10, 8, 7, 5];

const LOC_VALUES = LevelOfCareSchema.options;

export function generatePatients(facilities: SeedFacility[]): SeedPatient[] {
  const totalCapacity = facilities.reduce((s, f) => s + f.capacity, 0);
  const patients: SeedPatient[] = [];
  const ts = NOW.toISOString();

  for (const facility of facilities) {
    const count = Math.round((facility.capacity / totalCapacity) * 200);

    for (let i = 0; i < count; i++) {
      const admissionDate = faker.date.recent({ days: 60, refDate: NOW });
      const discharged = faker.number.float({ min: 0, max: 1 }) < 0.3;
      const dischargeDate = discharged
        ? addDays(admissionDate, faker.number.int({ min: 1, max: 45 }))
        : null;

      // Don't discharge after NOW
      const effectiveDischarge =
        dischargeDate && dischargeDate > NOW ? null : dischargeDate;

      const locMismatch = faker.number.float({ min: 0, max: 1 }) < 0.1;
      const otherLocs = LOC_VALUES.filter((l) => l !== facility.levelOfCare);
      const levelOfCare: LevelOfCare = locMismatch
        ? weightedPick(otherLocs, otherLocs.map(() => 1))
        : facility.levelOfCare;

      const authRoll = faker.number.float({ min: 0, max: 1 });
      let insuranceAuthExpiresAt: string | null;
      if (authRoll < 0.15) {
        // expired 1–14 days ago
        insuranceAuthExpiresAt = isoDate(
          addDays(NOW, -faker.number.int({ min: 1, max: 14 }))
        );
      } else if (authRoll < 0.85) {
        // expires in 7–30 days
        insuranceAuthExpiresAt = isoDate(
          addDays(NOW, faker.number.int({ min: 7, max: 30 }))
        );
      } else {
        insuranceAuthExpiresAt = null;
      }

      patients.push({
        id: newId("patient"),
        facilityId: facility.id,
        admissionDate: isoDate(admissionDate),
        dischargeDate: effectiveDischarge ? isoDate(effectiveDischarge) : null,
        levelOfCare,
        primaryDiagnosisCode: weightedPick(DIAGNOSIS_CODES, DIAGNOSIS_WEIGHTS),
        insurancePayer: weightedPick(PAYERS, PAYER_WEIGHTS),
        insuranceAuthExpiresAt,
        createdAt: ts,
      });
    }
  }

  return patients;
}

const ENCOUNTER_TYPES = EncounterTypeSchema.options;
const ENCOUNTER_WEIGHTS = [50, 20, 15, 10, 5];

export function generateEncounters(patients: SeedPatient[]): SeedEncounter[] {
  const encounters: SeedEncounter[] = [];
  const ts = NOW.toISOString();
  const admitted = patients.filter((p) => !p.dischargeDate);

  // ~15% of patients are frequent no-shows
  const noShowPatients = new Set(
    admitted
      .filter(() => faker.number.float({ min: 0, max: 1 }) < 0.15)
      .map((p) => p.id)
  );

  for (const patient of admitted) {
    const isNoShow = noShowPatients.has(patient.id);

    for (let d = 13; d >= 0; d--) {
      const encounterDate = addDays(NOW, -d);
      // Skip if before admission
      if (encounterDate < new Date(patient.admissionDate)) continue;

      const encounterType = weightedPick(ENCOUNTER_TYPES, ENCOUNTER_WEIGHTS);
      const attended = faker.number.float({ min: 0, max: 1 }) < (isNoShow ? 0.4 : 0.85);

      encounters.push({
        id: newId("encounter"),
        patientId: patient.id,
        encounterDate: encounterDate.toISOString(),
        encounterType,
        attended,
        notes: null,
        createdAt: ts,
      });
    }
  }

  return encounters;
}

export function generateRiskFlags(
  patients: SeedPatient[],
  encounters: SeedEncounter[]
): SeedRiskFlag[] {
  const flags: SeedRiskFlag[] = [];
  const ts = NOW.toISOString();
  const admitted = patients.filter((p) => !p.dischargeDate);
  const admittedIds = new Set(admitted.map((p) => p.id));

  // auth_lapse: insuranceAuthExpiresAt in past or within 3 days
  const threeDaysOut = isoDate(addDays(NOW, 3));
  for (const patient of patients) {
    if (
      patient.insuranceAuthExpiresAt !== null &&
      patient.insuranceAuthExpiresAt <= threeDaysOut
    ) {
      flags.push({
        id: newId("flag"),
        patientId: patient.id,
        flagType: FlagTypeSchema.enum.auth_lapse,
        severity: FlagSeveritySchema.enum.high,
        resolved: false,
        createdAt: ts,
        resolvedAt: null,
      });
    }
  }

  // missed_groups: admitted patients with <60% attendance over last 14 days
  const attendanceByPatient = new Map<string, { total: number; attended: number }>();
  for (const enc of encounters) {
    if (!admittedIds.has(enc.patientId)) continue;
    const cur = attendanceByPatient.get(enc.patientId) ?? { total: 0, attended: 0 };
    cur.total++;
    if (enc.attended) cur.attended++;
    attendanceByPatient.set(enc.patientId, cur);
  }

  for (const [patientId, stats] of attendanceByPatient.entries()) {
    if (stats.total > 0 && stats.attended / stats.total < 0.6) {
      flags.push({
        id: newId("flag"),
        patientId,
        flagType: FlagTypeSchema.enum.missed_groups,
        severity: FlagSeveritySchema.enum.medium,
        resolved: false,
        createdAt: ts,
        resolvedAt: null,
      });
    }
  }

  // ama_risk: randomly pick 5–8 admitted patients
  const amaCount = faker.number.int({ min: 5, max: 8 });
  const shuffledAdmitted = faker.helpers.shuffle([...admitted]);
  for (const patient of shuffledAdmitted.slice(0, amaCount)) {
    flags.push({
      id: newId("flag"),
      patientId: patient.id,
      flagType: FlagTypeSchema.enum.ama_risk,
      severity: FlagSeveritySchema.enum.high,
      resolved: false,
      createdAt: ts,
      resolvedAt: null,
    });
  }

  // failed_ua: 30% of patients who had a UA encounter
  const uaPatients = [
    ...new Set(
      encounters
        .filter((e) => e.encounterType === "ua")
        .map((e) => e.patientId)
    ),
  ];
  for (const patientId of uaPatients) {
    if (faker.number.float({ min: 0, max: 1 }) < 0.3) {
      flags.push({
        id: newId("flag"),
        patientId,
        flagType: FlagTypeSchema.enum.failed_ua,
        severity: FlagSeveritySchema.enum.high,
        resolved: false,
        createdAt: ts,
        resolvedAt: null,
      });
    }
  }

  // no_aftercare: randomly pick 10–15 admitted patients (separate shuffle for independence)
  const noAftercareCount = faker.number.int({ min: 10, max: 15 });
  const shuffledForNoAftercare = faker.helpers.shuffle([...admitted]);
  for (const patient of shuffledForNoAftercare.slice(0, noAftercareCount)) {
    flags.push({
      id: newId("flag"),
      patientId: patient.id,
      flagType: FlagTypeSchema.enum.no_aftercare,
      severity: FlagSeveritySchema.enum.low,
      resolved: false,
      createdAt: ts,
      resolvedAt: null,
    });
  }

  return flags;
}

export function generateSyntheticData(): SyntheticData {
  const facilities = generateFacilities();
  const patients = generatePatients(facilities);
  const encounters = generateEncounters(patients);
  const riskFlags = generateRiskFlags(patients, encounters);
  return { facilities, patients, encounters, riskFlags };
}
