import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { FacilityCensusRow } from "@/lib/db/queries/facilities";

type Props = {
  facility: FacilityCensusRow;
};

const LOC_BADGE: Record<string, string> = {
  detox:       "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  residential: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  php:         "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  iop:         "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  op:          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function FacilityCard({ facility }: Props) {
  const { name, levelOfCare, address, capacity, admittedCount, occupancyPct } = facility;
  const isOverCapacity = occupancyPct > 100;
  const badgeClass = LOC_BADGE[levelOfCare] ?? "bg-slate-100 text-slate-600";

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{name}</CardTitle>
          <span className={`shrink-0 capitalize rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
            {levelOfCare}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{address}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{occupancyPct}%</span>
          {isOverCapacity && (
            <span title="Census exceeds licensed capacity.">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </span>
          )}
        </div>
        <Progress value={Math.min(occupancyPct, 100)} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {admittedCount} admitted / {capacity} capacity
        </p>
      </CardContent>
    </Card>
  );
}
