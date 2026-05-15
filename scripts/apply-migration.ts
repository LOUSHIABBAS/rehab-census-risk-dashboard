/**
 * Fallback migration runner for Prisma 7 + @prisma/adapter-mssql.
 * `prisma migrate deploy` uses its own connection logic that bypasses the driver
 * adapter, so it fails with P1001 even when the adapter itself connects fine.
 * This script reads the migration SQL and applies it via the adapter directly.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaMssql(url);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting via adapter...");

  // Verify connection
  const ping = await prisma.$queryRaw<{ result: number }[]>`SELECT 1 AS result`;
  console.log("Connection OK:", ping);

  // Check if _prisma_migrations table exists (migration already applied)
  const tables = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM sys.tables ORDER BY name
  `;
  console.log(
    "Existing tables:",
    tables.map((t) => t.name)
  );

  const alreadyMigrated = tables.some((t) => t.name === "_prisma_migrations");
  const alreadyHasFacilities = tables.some((t) => t.name === "facilities");

  if (alreadyHasFacilities) {
    console.log("Tables already exist — migration already applied. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  // Read migration SQL
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "0001_init",
    "migration.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");

  // Split on GO statements (SQL Server batch separator) if present,
  // otherwise split on semicolons — then execute each statement
  const batches = sql
    .split(/\bGO\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying ${batches.length} SQL batch(es)...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) continue;
    try {
      await prisma.$executeRawUnsafe(batch);
      console.log(`  Batch ${i + 1}/${batches.length} OK`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore "already exists" errors so this script is re-runnable
      if (msg.includes("already an object named")) {
        console.log(`  Batch ${i + 1}/${batches.length} skipped (already exists)`);
      } else {
        throw err;
      }
    }
  }

  // Insert a _prisma_migrations record so Prisma CLI knows this migration was applied
  if (!alreadyMigrated) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE _prisma_migrations (
        id                      VARCHAR(36)  NOT NULL PRIMARY KEY,
        checksum                VARCHAR(64)  NOT NULL,
        finished_at             DATETIME2,
        migration_name          VARCHAR(255) NOT NULL,
        logs                    NVARCHAR(MAX),
        rolled_back_at          DATETIME2,
        started_at              DATETIME2    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        applied_steps_count     INT          NOT NULL DEFAULT 0
      )
    `).catch((e) => {
      if ((e as Error).message.includes("already an object named")) return;
      throw e;
    });

    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        NEWID(),
        'manual',
        CURRENT_TIMESTAMP,
        '0001_init',
        NULL,
        NULL,
        CURRENT_TIMESTAMP,
        1
      )
    `);
    console.log("Recorded migration in _prisma_migrations.");
  }

  console.log("\nMigration complete.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
