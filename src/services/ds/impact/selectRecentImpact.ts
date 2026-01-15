import { Impact } from "@/services/ds/impact";

const MAX_IMPACT_AGE_MS = 4 * 60 * 60 * 1000;

export function selectRecentImpact({
  dossierSubventionNumero,
  dossiersImpact,
}: {
  dossierSubventionNumero: number;
  dossiersImpact: Impact[];
}) {
  const now = Date.now();

  const recentCandidates = dossiersImpact
    .filter(
      (impact) =>
        impact.champs.numeroDossierSubvention === dossierSubventionNumero,
    )
    .map((impact) => {
      const updatedAtMs = impact.champs.updatedAt
        ? Date.parse(impact.champs.updatedAt)
        : NaN;
      return { impact, updatedAtMs };
    })
    .filter(
      ({ updatedAtMs }) =>
        !Number.isNaN(updatedAtMs) && now - updatedAtMs <= MAX_IMPACT_AGE_MS,
    )
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  return recentCandidates[0]?.impact;
}
