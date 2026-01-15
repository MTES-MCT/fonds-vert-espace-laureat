import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { SocleCommun } from "@/services/fondsvert/dossier";

export function CompletionSidebar({
  prefilledDsImpactUrl,
  socleCommun,
}: {
  prefilledDsImpactUrl: string;
  socleCommun?: SocleCommun;
}) {
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
