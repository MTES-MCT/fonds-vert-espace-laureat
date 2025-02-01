import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/utils/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_metrics: "true",
  include_finances: "true",
  type_export: "JSON",
};

type DossierFondsVert = {
  demarche_specifique: Record<string, string>;
  information_financiere: {
    informations_engagement: {
      annee_information_financiere: number;
      engagements_juridiques: {
        montant_engage: number;
        montant_engage_initial: number;
        demandes_paiement: {
          date_dp: string;
          montant_paye: number;
        }[];
      }[];
    };
  };
};

export async function getDossierFondsVert({
  dossierNumber,
}: {
  dossierNumber: number;
}): Promise<
  { success: false; error: string } | { success: true; data: DossierFondsVert }
> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
  });

  const dossierResult = await fetchFondsVert<{ data: DossierFondsVert }>(
    `dossiers/${dossierNumber}?${params.toString()}`,
  );

  if (!dossierResult.success) {
    if (dossierResult.status === 404) {
      return {
        success: false,
        error: "Impossible de trouver les détails pour ce dossier",
      };
    }

    if (dossierResult.status === 422) {
      return {
        success: false,
        error: "Les données ne sont pas encore disponibles pour cette démarche",
      };
    }

    return { success: false, error: "Une erreur est survenue" };
  }

  return {
    success: true,
    data: dossierResult.data.data,
  };
}
