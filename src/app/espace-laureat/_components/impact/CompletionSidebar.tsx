import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { ImpactReview } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactReview";
import { Impact } from "@/services/ds/impact";
import { Metrics, SocleCommun } from "@/services/fondsvert/dossier";
import {
  fetchPrefillMapping,
  getPrefillMappingCached,
} from "@/services/grist/impact";
import { requireEnv } from "@/utils/env";

export async function CompletionSidebar({
  numeroDossier,
  impact,
  metriques,
  socleCommun,
  nocache,
}: {
  numeroDossier: number;
  impact?: Impact;
  metriques?: Metrics;
  socleCommun?: SocleCommun;
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

  const metricValues = metriques
    ? Object.fromEntries(
        Object.entries(metriques)
          .filter(([, m]) => m.valeur_estimee !== null)
          .map(([key, m]) => [key, m.valeur_estimee]),
      )
    : {};

  const socleValues = socleCommun
    ? {
        demarche_title: socleCommun.demarche_title,
        date_engagement_premiere_depense: socleCommun.date_debut_execution,
        date_achevement_depenses_financees: socleCommun.date_fin_execution,
        total_des_depenses: socleCommun.total_des_depenses,
      }
    : {};

  const allMappings = {
    ...prefillMapping.champsMetriques,
    ...prefillMapping.champsSocleCommun,
  };

  const allValues = { ...metricValues, ...socleValues };

  const prefilledDsImpactUrl = new URL(dsImpactUrl);

  for (const [fieldName, fieldValue] of Object.entries(allValues)) {
    const champId = allMappings[fieldName];
    if (champId && fieldValue !== null) {
      prefilledDsImpactUrl.searchParams.append(
        `champ_${champId}`,
        String(fieldValue),
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
        className="fr-btn fr-btn--primary inline-flex w-full items-center justify-center"
        target="_blank"
        href={prefilledDsImpactUrl.toString()}
        data-testid="impact-evaluation-link"
      >
        Compléter l'évaluation
      </Link>
    </>
  );
}
