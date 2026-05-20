import Badge from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";

const severityByStatut: Record<
  string,
  "info" | "warning" | "error" | "success" | "new"
> = {
  "Non-commencé": "new",
  "En cours de réalisation": "info",
  Bloqué: "warning",
  Abandonné: "error",
  Terminé: "success",
};

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

export function StatutRealisation({
  statut,
  updatedAt,
  impactPrefillUrl,
}: {
  statut?: string;
  updatedAt?: string;
  impactPrefillUrl: string;
}) {
  const severity = statut ? (severityByStatut[statut] ?? "warning") : "warning";
  const label = statut ?? "INCONNU";

  return (
    <section aria-labelledby="status-heading" className="space-y-3 text-left">
      <h3
        id="status-heading"
        className="text-left text-base font-medium text-[var(--text-label-grey)]"
      >
        Avancement du projet
      </h3>
      <div className="space-y-2">
        <Badge small noIcon className="whitespace-nowrap" severity={severity}>
          {label}
        </Badge>
        {updatedAt && (
          <p className="fr-text--xs text-[var(--text-mention-grey)]">
            Dernière modification : {formatDate(updatedAt)}
          </p>
        )}
        <Link
          className="fr-btn fr-btn--secondary fr-btn--sm w-full justify-center"
          href={impactPrefillUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mettre à jour les données
        </Link>
      </div>
    </section>
  );
}
