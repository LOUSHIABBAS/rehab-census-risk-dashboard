import { writeFileSync } from "fs";
import { join } from "path";
import { generateSyntheticData } from "../lib/db/seed";

const data = generateSyntheticData();

const outPath = join(process.cwd(), "prisma", "seed-data.json");
writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

const flagBreakdown = data.riskFlags.reduce<Record<string, number>>((acc, f) => {
  acc[f.flagType] = (acc[f.flagType] ?? 0) + 1;
  return acc;
}, {});

console.log("=== Synthetic Seed Summary ===");
console.log(`Facilities : ${data.facilities.length}`);
console.log(`Patients   : ${data.patients.length}`);
console.log(`Encounters : ${data.encounters.length}`);
console.log(`Risk flags : ${data.riskFlags.length}`);
console.log("\nRisk flag breakdown:");
for (const [type, count] of Object.entries(flagBreakdown)) {
  console.log(`  ${type.padEnd(16)}: ${count}`);
}
console.log(`\nWrote ${outPath}`);
