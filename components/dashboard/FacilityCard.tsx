import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { FacilityCensusRow } from "@/lib/db/queries/facilities";

type Props = {
  facility: FacilityCensusRow;
};

export function FacilityCard({ facility }: Props) {
  const { name, levelOfCare, address, capacity, admittedCount, occupancyPct } = facility;
  const isOverCapacity = occupancyPct > 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 capitalize">
            {levelOfCare}
          </Badge>
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
