import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: string | number;
  subtle?: string;
  href?: string;
};

export function KpiCard({ label, value, subtle, href }: Props) {
  if (href) {
    return (
      <Link href={href} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        <Card className="relative transition-all hover:shadow-md hover:border-foreground/20 cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <ChevronRight className="h-6 w-6 text-teal-600 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
            {subtle && <p className="mt-1 text-xs text-muted-foreground">{subtle}</p>}
          </CardContent>
        </Card>
      </Link>
    );
  }

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
