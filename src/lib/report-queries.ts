import { queryOptions } from "@tanstack/react-query";
import { getPublicReportPoints } from "./reports.functions";
import { ATTENTION_WINDOW_DAYS } from "./regions";
import type { MapPoint } from "@/components/risk-map";

export const publicPointsOptions = queryOptions({
  queryKey: ["public-report-points"],
  queryFn: () => getPublicReportPoints(),
  staleTime: 60_000,
});

export function countByRegion(points: MapPoint[], now: Date = new Date()): Record<string, number> {
  const since = now.getTime() - ATTENTION_WINDOW_DAYS * 24 * 3600 * 1000;
  const counts: Record<string, number> = {};
  for (const p of points) {
    if (!p.region_id || new Date(p.created_at).getTime() < since) continue;
    counts[p.region_id] = (counts[p.region_id] ?? 0) + 1;
  }
  return counts;
}
