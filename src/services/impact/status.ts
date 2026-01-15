import { Impact } from "@/services/ds/impact";
import { selectRecentImpact } from "@/services/ds/impact/selectRecentImpact";
import { DossierFondsVert } from "@/services/fondsvert/dossier";

export type ImpactStatus = {
  statut?: string;
  updatedAt?: string;
};

export function resolveImpactStatus({
  dossierSubventionNumero,
  dossiersImpact,
  dossierFondsVert,
}: {
  dossierSubventionNumero: number;
  dossiersImpact: Impact[];
  dossierFondsVert?: DossierFondsVert;
}): ImpactStatus {
  const recentImpact = selectRecentImpact({
    dossierSubventionNumero,
    dossiersImpact,
  });

  if (recentImpact) {
    return {
      statut: recentImpact.champs.statutRealisationProjet,
      updatedAt: recentImpact.champs.updatedAt,
    };
  }

  return {
    statut:
      dossierFondsVert?.socle_commun?.statut_realisation_projet ?? undefined,
    updatedAt:
      dossierFondsVert?.socle_commun?.date_derniere_modification ?? undefined,
  };
}
