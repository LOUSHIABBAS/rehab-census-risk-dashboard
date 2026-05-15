"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";
import type { FacilityCensusRow } from "@/lib/db/queries/facilities";

type Props = {
  data: FacilityCensusRow[];
};

function barColor(pct: number): string {
  if (pct > 100) return "#ef4444"; // red-500
  if (pct >= 85) return "#f59e0b"; // amber-500
  return "#22c55e";                // green-500
}

export function OccupancyChart({ data }: Props) {
  return (
    <ChartContainer title="Occupancy by Facility">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
        >
          <XAxis
            type="number"
            domain={[0, Math.max(120, ...data.map((d) => d.occupancyPct + 10))]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Occupancy"]}
            cursor={{ fill: "hsl(var(--muted))" }}
          />
          <ReferenceLine x={100} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <Bar dataKey="occupancyPct" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={barColor(entry.occupancyPct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
