export async function GET() {
  try {
    // Lazy import: avoid constructing the Prisma adapter at build time.
    // CI doesn't have DATABASE_URL, so eager imports crash 'next build'.
    const { getFacilityCensus } = await import("@/lib/db/queries/facilities");
    const { listOpenRiskFlags } = await import("@/lib/db/queries/riskFlags");

    const facilities = await getFacilityCensus();
    const openRiskFlags = await listOpenRiskFlags();

    return Response.json({
      status: "ok",
      facilities: facilities.length,
      openRiskFlags: openRiskFlags.length,
      sampleFacility: facilities[0] ?? null,
    });
  } catch (error) {
    console.error("DB health check failed:", error);
    return Response.json(
      { status: "error", error: "Database unreachable" },
      { status: 500 }
    );
  }
}
