// DEV ONLY — this script truncates every table.
// Refuses to run if NODE_ENV is 'production' or if the DATABASE_URL host
// doesn't contain 'localhost' / a known dev hostname.
if (process.env.NODE_ENV === "production") {
  throw new Error("reset-dev-db.ts cannot run in production");
}

if (process.env.CONFIRM_RESET !== "yes") {
  console.warn(
    "\n⚠️  WARNING: This will delete ALL rows from every table in the database."
  );
  throw new Error(
    "Refusing to reset. Set CONFIRM_RESET=yes to proceed (e.g. CONFIRM_RESET=yes pnpm db:reset)"
  );
}

import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({ adapter: new PrismaMssql(url) });

async function main() {
  await prisma.riskFlag.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.facility.deleteMany();
  console.log("All tables cleared.");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
