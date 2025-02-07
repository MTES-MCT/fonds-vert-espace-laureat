import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_metrics: "true",
  include_finances: "true",
  type_export: "JSON",
};

export type Metrics = Record<string, string | number | object | null>;

type DossierFondsVert = {
  demarche_specifique: Metrics;
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
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<
  { success: false; error: string } | { success: true; data: DossierFondsVert }
> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
  });

  const dossierResult = await fetchFondsVert<{ data: DossierFondsVert }>(
    `dossiers/${numeroDossier}?${params.toString()}`,
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
        error:
          "Les metriques de cette démarche ne sont pas disponibles dans l'API Fonds Vert.",
      };
    }

    return { success: false, error: "Une erreur est survenue" };
  }

  return {
    success: true,
    data: dossierResult.data.data,
  };
}
