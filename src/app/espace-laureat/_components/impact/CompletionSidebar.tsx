import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { ImpactReview } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactReview";
import { Impact } from "@/services/ds/impact";
import { Metrics } from "@/services/fondsvert/dossier";
import {
  fetchPrefillMapping,
  getPrefillMappingCached,
} from "@/services/grist/impact";
import { requireEnv } from "@/utils/env";

export async function CompletionSidebar({
  numeroDossier,
  impact,
  metriques,
  nocache,
}: {
  numeroDossier: number;
  impact?: Impact;
  metriques?: Metrics;
  nocache: boolean;
}) {
  // Si le formulaire a déjà été rempli alors on affiche un bouton pour le consulter :
  if (impact?.numero) {
    return <ImpactReview impact={impact} />;
  }

  // Sinon, on crée le lien qui va préremplir vers le formulaire avec les données connues :
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
        data-testid="impact-evaluation-link"
      >
        Compléter l'évaluation
      </Link>
    </>
  );
}
