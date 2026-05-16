import type { SafeUrPayload } from "@/lib/phi/deidentify";

const LOC_LABELS: Record<string, string> = {
  detox: "Medical Detoxification",
  residential: "Residential Treatment",
  php: "Partial Hospitalization Program",
  iop: "Intensive Outpatient Program",
  op: "Outpatient Program",
};

export function buildUrNotePrompt(payload: SafeUrPayload): { system: string; user: string } {
  const system = `You are a utilization review specialist at an addiction treatment facility. You draft concise clinical justification notes that case managers will review and submit to insurance payors to authorize continued patient care.

Tone: clinical, factual, payor-appropriate. Avoid clichés. Use only the data provided; do not invent details. The note must be a complete draft a case manager can polish in 60 seconds.

Output format (exactly):

PATIENT: <patientToken>
FACILITY: <facilityName>
LEVEL OF CARE: <levelOfCare, expanded — e.g. "Residential Treatment">
DAYS IN TREATMENT: <number>

CLINICAL JUSTIFICATION:
<2-3 paragraphs. Integrate the active risk flags into a coherent case for continued treatment. Reference specific flags by name. Use the diagnosis category to frame medical necessity.>

RISK INDICATORS:
- <one bullet per active flag, with severity>

RECOMMENDATION:
<1 paragraph. Request specific additional days at current or stepped-down level of care. Justify the duration based on the flag pattern.>

No preamble, no closing remarks, no markdown formatting beyond the structure above.`;

  const locExpanded = LOC_LABELS[payload.levelOfCare] ?? payload.levelOfCare;

  const flagSummary = payload.activeFlags
    .map((f) => `  - flagType: ${f.flagType}, severity: ${f.severity}, daysOpen: ${f.daysOpen}`)
    .join("\n");

  const user = `Here is today's de-identified patient data for the UR note:

patientToken: ${payload.patientToken}
facilityName: ${payload.facilityName}
levelOfCare: ${locExpanded}
daysInTreatment: ${payload.daysInTreatment}
diagnosisCategory: ${payload.diagnosisCategory}
insurancePayer: ${payload.insurancePayer}
activeFlags:
${flagSummary || "  (none)"}

Draft a UR note for this patient.`;

  return { system, user };
}
