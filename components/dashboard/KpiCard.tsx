import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: string | number;
  subtle?: string;
  href?: string;
};

export function KpiCard({ label, value, subtle, href }: Props) {
  const content = (
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {subtle && <p className="mt-1 text-xs text-muted-foreground">{subtle}</p>}
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        <Card className="transition-shadow hover:shadow-md hover:border-foreground/20 cursor-pointer">
          {content}
        </Card>
      </Link>
    );
  }

  return <Card>{content}</Card>;
}
