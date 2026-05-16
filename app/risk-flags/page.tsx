export const dynamic = "force-dynamic";

import Link from "next/link";
import type { OpenRiskFlagRow } from "@/lib/db/queries/riskFlags";
import { RiskFlagsExplorer } from "@/components/risk-flags/RiskFlagsExplorer";

export default async function RiskFlagsPage() {
  const { listOpenRiskFlags } = await import("@/lib/db/queries/riskFlags");
  const { listFacilities } = await import("@/lib/db/queries/facilities");

  const [flags, facilities]: [OpenRiskFlagRow[], { id: string; name: string }[]] =
    await Promise.all([listOpenRiskFlags(), listFacilities()]);

  const facilityCount = new Set(flags.map((f) => f.patient.facility.id)).size;

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Open Risk Flags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {flags.length} unresolved flag{flags.length !== 1 ? "s" : ""} across {facilityCount}{" "}
          facilit{facilityCount !== 1 ? "ies" : "y"}
        </p>
      </div>

      <RiskFlagsExplorer flags={flags} facilities={facilities} />
    </main>
  );
}
