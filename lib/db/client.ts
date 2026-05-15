import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma 7 requires a driver adapter for SQL Server.
// PrismaMssql stores the connection config lazily — no actual connection is
// made until the first query fires at runtime.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaMssql(process.env.DATABASE_URL ?? "");

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
