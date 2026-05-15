# Rehab Census & Risk Dashboard

Healthcare operations analytics for addiction treatment facilities. Built as a portfolio project demonstrating an AI-native development workflow with Claude Code.

## Purpose

A Next.js dashboard that ingests synthetic rehab facility data (modeled on Kipu EHR's data structure), stores it in Azure SQL, and uses AWS Bedrock (Claude) to generate operational summaries and flag at-risk patients for facility operators.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript (strict mode), shadcn/ui, Tailwind CSS, Recharts
- **Database:** Azure SQL (Serverless tier). Use the `mssql` driver via Drizzle ORM.
- **AI Layer:** AWS Bedrock SDK, calling Claude Sonnet via `@aws-sdk/client-bedrock-runtime`
- **Validation:** Zod for all API input/output
- **Package manager:** pnpm

## Domain Model (Kipu-inspired, synthetic only)

This project uses **synthetic data only**. No real PHI ever enters this codebase.

Core entities:
- **Facility** — id, name, address, capacity, level_of_care
- **Patient** — id, facility_id, admission_date, discharge_date (nullable), level_of_care, primary_diagnosis_code, insurance_payer, insurance_auth_expires_at
- **Encounter** — id, patient_id, encounter_type (group, individual, UA, medical), encounter_date, attended (bool), notes
- **RiskFlag** — id, patient_id, flag_type (ama_risk, auth_lapse, missed_groups, failed_ua), severity, created_at

## HIPAA & PHI Guardrails

Even though all data is synthetic, this project models production HIPAA practices:

1. **Never send identifiers to Bedrock.** Strip name, DOB, MRN, SSN, address, phone before any LLM call. Use opaque IDs (e.g., `patient_abc123`) in prompts.
2. **De-identification helper** lives at `lib/phi/deidentify.ts`. Every Bedrock-bound payload must pass through it.
3. **Audit log:** every Bedrock call writes a row to `ai_audit_log` (user_id, action, prompt_hash, response_hash, timestamp). Never log raw PHI.
4. **No PHI in client components.** Patient detail views fetch data server-side; sensitive fields filtered based on role.

## Code Conventions

- TypeScript strict mode, no `any` (use `unknown` and narrow)
- Server Components by default; mark Client Components with `'use client'` only when needed
- API routes under `app/api/*/route.ts` using Next.js Route Handlers
- All API input validated with Zod schemas in `lib/schemas/`
- Database queries in `lib/db/queries/` — never query directly from a route handler
- Components from shadcn/ui live in `components/ui/`; custom components in `components/`
- Tailwind only — no separate CSS files except `globals.css`
- Use `pnpm dlx shadcn@latest add <component>` to install shadcn components

## Project Structure

app/
(dashboard)/
page.tsx              # Census overview
facilities/[id]/      # Facility detail
patients/[id]/        # Patient detail (server component, role-gated)
api/
briefing/route.ts     # Bedrock daily briefing endpoint
risk-flags/route.ts
components/
ui/                     # shadcn primitives
charts/                 # Recharts wrappers
dashboard/              # Domain components
lib/
db/
schema.ts             # Drizzle schema
queries/              # Typed query functions
seed.ts               # Synthetic data generator
bedrock/
client.ts             # Bedrock SDK setup
prompts/              # Prompt templates
phi/
deidentify.ts         # PHI stripping
schemas/                # Zod validation schemas


## Working Agreements with Claude Code

- Before editing files, check the existing patterns in nearby code
- When adding a new feature, follow the layering: schema → query → API route → component
- Prefer small, focused PRs/commits; each commit message should explain *why*
- When a task touches Bedrock or patient data, restate the PHI guardrails before writing code
- If a library version is unclear, check `package.json` rather than assuming
- Default to typed, not stringly-typed (e.g., enums or union types for `level_of_care`)