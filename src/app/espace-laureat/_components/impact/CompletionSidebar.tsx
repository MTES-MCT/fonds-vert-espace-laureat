import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { ImpactReview } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/ImpactReview";
import { Impact } from "@/services/ds/impact";
import { Metrics, SocleCommun } from "@/services/fondsvert/dossier";
import { buildImpactPrefillUrl } from "@/services/grist/impact";

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

  const prefilledDsImpactUrl = await buildImpactPrefillUrl({
    numeroDossier,
    metriques,
    socleCommun,
    nocache,
  });

  return (
    <>
      <Help>
        Évaluez l'impact réel de votre projet, conformément aux engagements liés
        à la subvention.
      </Help>
      <Link
        className="fr-btn fr-btn--primary inline-flex w-full items-center justify-center"
        target="_blank"
        href={prefilledDsImpactUrl}
        data-testid="impact-evaluation-link"
      >
        Compléter l'évaluation
      </Link>
    </>
  );
}
