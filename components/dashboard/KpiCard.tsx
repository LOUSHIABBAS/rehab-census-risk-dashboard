import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: string | number;
  subtle?: string;
};

export function KpiCard({ label, value, subtle }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {subtle && <p className="mt-1 text-xs text-muted-foreground">{subtle}</p>}
      </CardContent>
    </Card>
  );
}
