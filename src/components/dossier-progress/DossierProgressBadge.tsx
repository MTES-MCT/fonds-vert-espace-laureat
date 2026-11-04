import Badge from "@codegouvfr/react-dsfr/Badge";

import type { DossierProgressStatus } from "@/utils/dossierProgress";

const severityByStatus = {
  "Non-commencé": "new",
  "En cours de réalisation": "info",
  Bloqué: "warning",
  Abandonné: "error",
  Terminé: "success",
} as const;

export function DossierProgressBadge({
  status,
}: {
  status: DossierProgressStatus | null;
}) {
  return status ? (
    <Badge as="span" small noIcon severity={severityByStatus[status]}>
      {status}
    </Badge>
  ) : (
    <span>Non renseigné</span>
  );
}
