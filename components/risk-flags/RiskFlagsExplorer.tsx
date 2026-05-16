"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { SeverityDot } from "@/components/risk-flags/SeverityDot";
import { FlagTypeLabel } from "@/components/risk-flags/FlagTypeLabel";
import { UrNoteSheet } from "@/components/risk-flags/UrNoteSheet";
import { formatDaysOpen, formatShortDate } from "@/lib/utils";
import type { OpenRiskFlagRow } from "@/lib/db/queries/riskFlags";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const ALL_SEVERITIES = ["high", "medium", "low"];
const FLAG_TYPES = ["ama_risk", "auth_lapse", "missed_groups", "failed_ua", "no_aftercare"];

type SortKey = "severity" | "daysOpen" | "createdAt";
type SortDir = "asc" | "desc";

type Props = {
  flags: OpenRiskFlagRow[];
  facilities: { id: string; name: string }[];
};

function ChevronIcon({ dir, active }: { dir: SortDir; active: boolean }) {
  return (
    <span className={`ml-1 inline-block transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function RiskFlagsExplorer({ flags, facilities }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL
  const urlFacility = searchParams.get("facility") ?? "all";
  const urlSeverities = searchParams.get("severity")?.split(",").filter(Boolean) ?? ALL_SEVERITIES;
  const urlTypes = searchParams.get("type")?.split(",").filter(Boolean) ?? FLAG_TYPES;

  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  function handleFacilityChange(val: string) {
    updateParams({ facility: val === "all" ? null : val });
  }

  function handleSeverityChange(val: string[]) {
    updateParams({ severity: val.length === ALL_SEVERITIES.length ? null : val.join(",") });
  }

  function handleTypeChange(val: string) {
    // Toggle a single type in/out of the set
    const current = new Set(urlTypes);
    if (current.has(val)) {
      current.delete(val);
    } else {
      current.add(val);
    }
    const next = [...current];
    updateParams({ type: next.length === FLAG_TYPES.length ? null : next.join(",") });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "severity" ? "asc" : "desc");
    }
  }

  function clearFilters() {
    router.replace(pathname, { scroll: false });
  }

  const filtered = flags.filter((f) => {
    if (urlFacility !== "all" && f.patient.facility.id !== urlFacility) return false;
    if (!urlSeverities.includes(f.severity)) return false;
    if (!urlTypes.includes(f.flagType)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "severity") {
      cmp = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const isFiltered =
    urlFacility !== "all" ||
    urlSeverities.length !== ALL_SEVERITIES.length ||
    urlTypes.length !== FLAG_TYPES.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Facility */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Facility</p>
          <select
            value={urlFacility}
            onChange={(e) => handleFacilityChange(e.target.value)}
            className="h-9 w-52 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Severity</p>
          <ToggleGroup
            type="multiple"
            value={urlSeverities}
            onValueChange={handleSeverityChange}
            className="gap-1"
          >
            <ToggleGroupItem value="high" className="text-xs px-3 data-[state=on]:bg-red-100 data-[state=on]:text-red-700">
              High
            </ToggleGroupItem>
            <ToggleGroupItem value="medium" className="text-xs px-3 data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700">
              Medium
            </ToggleGroupItem>
            <ToggleGroupItem value="low" className="text-xs px-3 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-600">
              Low
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Flag type */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Flag type</p>
          <div className="flex flex-wrap gap-1">
            {FLAG_TYPES.map((t) => {
              const active = urlTypes.includes(t);
              const labels: Record<string, string> = {
                ama_risk: "AMA Risk",
                auth_lapse: "Auth Lapse",
                missed_groups: "Missed Groups",
                failed_ua: "Failed UA",
                no_aftercare: "No Aftercare",
              };
              return (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs self-end">
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No risk flags match the current filters.</p>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-xs">
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none w-36"
                  onClick={() => handleSort("severity")}
                >
                  Severity
                  <ChevronIcon dir={sortDir} active={sortKey === "severity"} />
                </TableHead>
                <TableHead>Flag type</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead
                  className="cursor-pointer select-none w-28"
                  onClick={() => handleSort("daysOpen")}
                >
                  Days open
                  <ChevronIcon dir={sortDir} active={sortKey === "daysOpen"} />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none w-24"
                  onClick={() => handleSort("createdAt")}
                >
                  Created
                  <ChevronIcon dir={sortDir} active={sortKey === "createdAt"} />
                </TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((flag) => (
                <TableRow key={flag.id} className="hover:bg-muted/50">
                  <TableCell>
                    <SeverityDot severity={flag.severity} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <FlagTypeLabel type={flag.flagType} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <span title={flag.patient.id}>
                      {flag.patient.id.slice(0, 12)}…
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{flag.patient.facility.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDaysOpen(flag.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(flag.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {flag.flagType === "auth_lapse" && (
                      <button
                        onClick={() => setSelectedPatientId(flag.patient.id)}
                        className="text-xs text-primary underline-offset-2 hover:underline"
                      >
                        Draft UR Note
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedPatientId && (
        <UrNoteSheet
          patientId={selectedPatientId}
          open={selectedPatientId !== null}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  );
}
