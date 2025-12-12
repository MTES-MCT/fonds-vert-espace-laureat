import Badge from "@codegouvfr/react-dsfr/Badge";

import { EtatEngagement } from "@/services/fondsvert/dossier";

const ETAT_ENGAGEMENT_CONFIG: Record<
  EtatEngagement,
  { label: string; severity?: "success" | "info" | "warning" | "error" | "new" }
> = {
  "en cours": { label: "En cours", severity: "new" },
  "non démarré": { label: "Non démarré" },
  soldé: { label: "Soldé", severity: "success" },
  clos: { label: "Clos", severity: "info" },
  inconnu: { label: "Inconnu", severity: "error" },
};

export function EtatEngagementBadge({
  etatEngagement,
}: {
  etatEngagement: EtatEngagement;
}) {
  const config = ETAT_ENGAGEMENT_CONFIG[etatEngagement];

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm text-[var(--text-mention-grey)]">
        Statut des paiements de la subvention
      </span>
      <Badge small noIcon severity={config.severity}>
        {config.label}
      </Badge>
    </div>
  );
}
