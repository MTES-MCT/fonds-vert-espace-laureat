import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { Metrics } from "@/services/fondsvert/dossier";
import {
  fetchPrefillMapping,
  getPrefillMappingCached,
} from "@/services/grist/impact";
import { requireEnv } from "@/utils/env";

export async function ImpactSubmission({
  numeroDossier,
  metriques,
  nocache,
}: {
  numeroDossier: number;
  metriques?: Metrics;
  nocache: boolean;
}) {
  const [dsImpactUrl] = requireEnv("DS_IMPACT_URL");

  const prefillMapping = nocache
    ? await fetchPrefillMapping()
    : await getPrefillMappingCached();

  const metricEntries = metriques
    ? Object.entries(metriques).filter(
        ([, metricValue]) => metricValue.valeur_estimee !== null,
      )
    : [];

  const prefilledDsImpactUrl = new URL(dsImpactUrl);

  for (const [metricKey, metricValue] of metricEntries) {
    const champId = prefillMapping.champsMetriques[metricKey];
    if (champId) {
      prefilledDsImpactUrl.searchParams.append(
        `champ_${champId}`,
        String(metricValue.valeur_estimee),
      );
    }
  }

  prefilledDsImpactUrl.searchParams.append(
    `champ_${prefillMapping.champNumeroDossier}`,
    String(numeroDossier),
  );

  return (
    <>
      <Help>
        Évaluez l'impact réel de votre projet, conformément aux engagements liés
        à la subvention.
      </Help>
      <Link
        className="fr-btn fr-btn--primary w-full inline-flex items-center justify-center"
        target="_blank"
        href={prefilledDsImpactUrl.toString()}
      >
        Compléter l'évaluation
      </Link>
      {metricEntries.length > 0 && (
        <>
          <p className="mt-8 mb-2 font-medium">Vos estimations</p>
          <ul className="list-none text-xs text-gray-600 text-left p-0 mb-0">
            {metricEntries.map(([key, metricValue]) => (
              <li key={key} className="my-2 last:mb-0 pt-3 pb-0 border-t">
                <div>{metricValue.label}</div>
                <span className="text-base font-medium">
                  {metricValue.valeur_estimee}
                  {metricValue.unite && ` ${metricValue.unite}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
