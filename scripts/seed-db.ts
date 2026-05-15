import { readFileSync } from "fs";
import { join } from "path";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../lib/generated/prisma/client";
import type { SyntheticData } from "../lib/db/seed";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMssql(url) });

const CHUNK_SIZE = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const dataPath = join(process.cwd(), "prisma", "seed-data.json");
  const data: SyntheticData = JSON.parse(readFileSync(dataPath, "utf-8"));

  // Idempotency check — abort if already seeded
  const existing = await prisma.facility.count();
  if (existing > 0) {
    console.log(`Seed aborted: ${existing} facilities already exist. Run against a clean DB.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("Starting seed transaction...");

  await prisma.$transaction(async (tx) => {
    // 1. Facilities
    await tx.facility.createMany({
      data: data.facilities.map((f) => ({ ...f, createdAt: new Date(f.createdAt) })),
    });
    console.log(`  Inserted ${data.facilities.length} facilities`);

    // 2. Patients — date strings must be Date objects for Prisma's DateTime fields
    await tx.patient.createMany({
      data: data.patients.map((p) => ({
        ...p,
        admissionDate: new Date(p.admissionDate),
        dischargeDate: p.dischargeDate ? new Date(p.dischargeDate) : null,
        insuranceAuthExpiresAt: p.insuranceAuthExpiresAt
          ? new Date(p.insuranceAuthExpiresAt)
          : null,
        createdAt: new Date(p.createdAt),
      })),
    });
    console.log(`  Inserted ${data.patients.length} patients`);

    // 3. Encounters — batch in chunks of 500 to avoid SQL parameter limits
    const encounterChunks = chunk(data.encounters, CHUNK_SIZE);
    let encTotal = 0;
    for (const batch of encounterChunks) {
      await tx.encounter.createMany({
        data: batch.map((e) => ({
          ...e,
          encounterDate: new Date(e.encounterDate),
          createdAt: new Date(e.createdAt),
        })),
      });
      encTotal += batch.length;
    }
    console.log(`  Inserted ${encTotal} encounters (${encounterChunks.length} batches)`);

    // 4. Risk flags
    const flagChunks = chunk(data.riskFlags, CHUNK_SIZE);
    let flagTotal = 0;
    for (const batch of flagChunks) {
      await tx.riskFlag.createMany({
        data: batch.map((f) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          resolvedAt: f.resolvedAt ? new Date(f.resolvedAt) : null,
        })),
      });
      flagTotal += batch.length;
    }
    console.log(`  Inserted ${flagTotal} risk flags (${flagChunks.length} batches)`);
  });

  // Verify counts
  const [fCount, pCount, eCount, rCount] = await Promise.all([
    prisma.facility.count(),
    prisma.patient.count(),
    prisma.encounter.count(),
    prisma.riskFlag.count(),
  ]);

  console.log("\n=== Seed Complete ===");
  console.log(`Facilities : ${fCount}`);
  console.log(`Patients   : ${pCount}`);
  console.log(`Encounters : ${eCount}`);
  console.log(`Risk flags : ${rCount}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
