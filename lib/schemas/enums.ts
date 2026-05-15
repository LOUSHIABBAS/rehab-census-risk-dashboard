import { z } from "zod";

export const LevelOfCareSchema = z.enum([
  "detox",
  "residential",
  "php",
  "iop",
  "op",
]);
export type LevelOfCare = z.infer<typeof LevelOfCareSchema>;

export const EncounterTypeSchema = z.enum([
  "group",
  "individual",
  "ua",
  "medical",
  "family",
]);
export type EncounterType = z.infer<typeof EncounterTypeSchema>;

export const FlagTypeSchema = z.enum([
  "ama_risk",
  "auth_lapse",
  "missed_groups",
  "failed_ua",
  "no_aftercare",
]);
export type FlagType = z.infer<typeof FlagTypeSchema>;

export const FlagSeveritySchema = z.enum(["low", "medium", "high"]);
export type FlagSeverity = z.infer<typeof FlagSeveritySchema>;
