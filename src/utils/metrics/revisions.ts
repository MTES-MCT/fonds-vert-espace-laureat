import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";

export function keepNewestMetricRevision(
  current: DossierMetricRevisionTarget | undefined,
  candidate: DossierMetricRevisionTarget,
): DossierMetricRevisionTarget {
  return current && current.revision > candidate.revision ? current : candidate;
}
