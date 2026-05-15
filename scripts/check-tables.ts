import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const prisma = new PrismaClient({ adapter: new PrismaMssql(url) });

async function main() {
  const rows = await prisma.$queryRaw<{ name: string }[]>`SELECT name FROM sys.tables ORDER BY name`;
  console.log("Tables:", rows.map((r) => r.name));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
