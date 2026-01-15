import Badge from "@codegouvfr/react-dsfr/Badge";

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
}: {
  statut?: string;
  updatedAt?: string;
}) {
  const severity = statut ? (severityByStatut[statut] ?? "warning") : "warning";
  const label = statut ?? "INCONNU";

  return (
    <section aria-labelledby="status-heading" className="text-left">
      <h3
        id="status-heading"
        className="mb-3 text-left text-base font-medium text-[var(--text-label-grey)]"
      >
        Avancement du projet
      </h3>
      <dl className="space-y-2">
        <div>
          <dt className="text-xs font-medium text-[var(--text-mention-grey)]">
            État d'avancement
          </dt>
          <dd className="mb-1 text-sm">
            <Badge
              small
              noIcon
              className="whitespace-nowrap"
              severity={severity}
            >
              {label}
            </Badge>
          </dd>
        </div>
        {updatedAt && (
          <div>
            <dt className="text-xs font-medium text-[var(--text-mention-grey)]">
              Dernière mise à jour
            </dt>
            <dd className="text-sm text-[var(--text-default-grey)]">
              Le {formatDate(updatedAt)}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
