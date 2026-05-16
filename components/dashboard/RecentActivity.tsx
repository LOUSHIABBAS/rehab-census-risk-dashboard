import type { OpenRiskFlagRow } from "@/lib/db/queries/riskFlags";
import { SeverityDot } from "@/components/risk-flags/SeverityDot";
import { FlagTypeLabel } from "@/components/risk-flags/FlagTypeLabel";

type Props = {
  flags: OpenRiskFlagRow[];
};

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity({ flags }: Props) {
  if (flags.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <p className="page-subtitle">Last 5 risk flags raised across the organization</p>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />

        <ol className="space-y-0">
          {flags.map((flag) => (
            <li key={flag.id} className="flex items-start gap-4 py-3 pl-1">
              {/* Timeline node — aligned with the line */}
              <div className="mt-0.5 shrink-0 z-10">
                <SeverityDot severity={flag.severity} dotOnly />
              </div>

              <div className="flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                <span className="text-sm font-medium">
                  <FlagTypeLabel type={flag.flagType} />
                </span>
                <span className="text-sm text-muted-foreground">
                  {flag.patient.facility.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground/70" title={flag.patient.id}>
                  {flag.patient.id.slice(0, 12)}…
                </span>
              </div>

              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {timeAgo(flag.createdAt)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
