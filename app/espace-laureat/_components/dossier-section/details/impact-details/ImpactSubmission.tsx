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
  metriques: Metrics;
  nocache: boolean;
}) {
  const [dsImpactUrl] = requireEnv("DS_IMPACT_URL");

  const prefillMapping = nocache
    ? await fetchPrefillMapping()
    : await getPrefillMappingCached();

  // Pour le moment, les sous-mesures (value de type object) ne sont pas supportées
  const metricEntries = Object.entries(metriques).filter(
    (entry): entry is [string, string | number] =>
      ["string", "number"].includes(typeof entry[1]),
  );

  const prefilledDsImpactUrl = new URL(dsImpactUrl);

  for (const [metricKey, value] of metricEntries) {
    const champId = prefillMapping.champsMetriques[metricKey];
    if (champId) {
      prefilledDsImpactUrl.searchParams.append(
        `champ_${champId}`,
        String(value),
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
        Les données de votre projet participent à la transition écologique.
        Merci de compléter l'évaluation d'impact réel de votre projet,
        conformément aux engagements liés à la subvention.
      </Help>
      {metricEntries.length > 0 && (
        <>
          <p>
            Pour rappel, voici les metriques que vous avez renseignées lors de
            la demande de subvention :
          </p>
          <ul>
            {metricEntries.map(([key, value]) => (
              <li key={key}>
                {key}: <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link
        className="fr-btn fr-btn--tertiary fr-btn--sm bg-white hover:bg-gray-50"
        target="_blank"
        href={prefilledDsImpactUrl.toString()}
      >
        Compléter l'évaluation
      </Link>
    </>
  );
}
