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
        Actualisez régulièrement les données du projet pour assurer un suivi
        précis et conforme aux engagements de la subvention.
      </Help>
      {socleCommun?.date_derniere_modification && (
        <p className="fr-text--xs fr-mb-2w text-[var(--text-mention-grey)]">
          Dernière modification :{" "}
          {new Date(socleCommun.date_derniere_modification).toLocaleDateString(
            "fr-FR",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            },
          )}
        </p>
      )}
      <Link
        className="fr-btn fr-btn--primary inline-flex w-full items-center justify-center"
        target="_blank"
        href={prefilledDsImpactUrl}
        data-testid="impact-evaluation-link"
      >
        Mettre à jour les données
      </Link>
    </>
  );
}
