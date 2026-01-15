import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return dateFormatter.format(date);
}

export function CompletionSidebar({
  prefilledDsImpactUrl,
  updatedAt,
}: {
  prefilledDsImpactUrl: string;
  updatedAt?: string;
}) {
  return (
    <>
      <Help>
        Actualisez régulièrement les données du projet pour assurer un suivi
        précis et conforme aux engagements de la subvention.
      </Help>
      {updatedAt && (
        <p className="fr-text--xs fr-mb-2w text-[var(--text-mention-grey)]">
          Dernière modification : {formatDate(updatedAt)}
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
