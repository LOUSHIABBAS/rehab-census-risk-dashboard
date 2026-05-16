import { cn } from "@/lib/utils";

type Severity = "high" | "medium" | "low";

const DOT_COLOR: Record<Severity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

const LABEL_COLOR: Record<Severity, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-slate-500",
};

type Props = { severity: string };

export function SeverityDot({ severity }: Props) {
  const s = severity as Severity;
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full shrink-0", DOT_COLOR[s] ?? "bg-slate-300")} />
      <span className={cn("capitalize text-sm font-medium", LABEL_COLOR[s] ?? "text-slate-500")}>
        {severity}
      </span>
    </span>
  );
}
