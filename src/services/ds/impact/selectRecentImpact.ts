import { Impact } from "@/services/ds/impact";

export const MAX_IMPACT_AGE_MS = 4 * 60 * 60 * 1000;

export function selectRecentImpact({
  dossierSubventionNumero,
  dossiersImpact,
}: {
  dossierSubventionNumero: number;
  dossiersImpact: Impact[];
}) {
  const candidates = dossiersImpact
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
    .filter(({ updatedAtMs }) => !Number.isNaN(updatedAtMs))
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  return candidates[0]?.impact;
}
