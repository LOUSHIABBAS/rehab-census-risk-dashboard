import { cn } from "@/lib/utils";

type Severity = "high" | "medium" | "low";

const DOT_COLOR: Record<Severity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

const RING_COLOR: Record<Severity, string> = {
  high: "ring-red-400/30",
  medium: "ring-amber-400/30",
  low: "ring-slate-400/30",
};

const LABEL_COLOR: Record<Severity, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-slate-500",
};

type Props = { severity: string; dotOnly?: boolean };

export function SeverityDot({ severity, dotOnly = false }: Props) {
  const s = severity as Severity;
  const dot = (
    <span className={cn("h-3 w-3 rounded-full ring-2 shrink-0", RING_COLOR[s] ?? "ring-slate-400/30")}>
      <span className={cn("block h-2 w-2 rounded-full m-0.5", DOT_COLOR[s] ?? "bg-slate-300")} />
    </span>
  );

  if (dotOnly) return dot;

  return (
    <span className="flex items-center gap-1.5">
      {dot}
      <span className={cn("capitalize text-sm font-medium", LABEL_COLOR[s] ?? "text-slate-500")}>
        {severity}
      </span>
    </span>
  );
}
