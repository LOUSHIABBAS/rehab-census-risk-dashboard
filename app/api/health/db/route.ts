import { NextResponse } from "next/server";
import { getFacilityCensus } from "@/lib/db/queries/facilities";
import { listOpenRiskFlags } from "@/lib/db/queries/riskFlags";

export async function GET() {
  try {
    const [facilities, openFlags] = await Promise.all([
      getFacilityCensus(),
      listOpenRiskFlags(),
    ]);

    return NextResponse.json({
      status: "ok",
      facilities: facilities.length,
      openRiskFlags: openFlags.length,
      sampleFacility: facilities[0] ?? null,
    });
  } catch (err) {
    console.error("[health/db]", err);
    return NextResponse.json({ status: "error", error: "Database query failed" }, { status: 500 });
  }
}
