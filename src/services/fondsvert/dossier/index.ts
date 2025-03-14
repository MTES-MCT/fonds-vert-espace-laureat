import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_metrics: "true",
  include_finances: "true",
  type_export: "JSON",
};

export type MetricValue = {
  label: string;
  unite: string | null;
  valeur_estimee: number | null;
  valeur_reelle: number | null;
};

export type Metrics = Record<string, MetricValue>;

interface DemandePaiement {
  numero_dp: string;
  date_dp: string;
  montant_paye: number;
}

interface EngagementJuridiques {
  numero_ej: string;
  nom_demarche: string;
  nom_axe: number;
  montant_engage: number;
  montant_engage_initial: number;
  demandes_paiement: DemandePaiement[];
}

interface InformationsEngagement {
  annee_information_financiere: number;
  engagements_juridiques: EngagementJuridiques[];
}

export interface InformationFinanciere {
  centre_financier_chorus: string;
  informations_engagement: InformationsEngagement[];
}

export interface DossierFondsVert {
  metrique_specifique?: Metrics;
  information_financiere?: InformationFinanciere;
}

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
    `v2/dossiers/${numeroDossier}?${params.toString()}`,
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
          "L'historique n'est pas encore disponible pour ce type de démarche.",
      };
    }

    console.error(
      `Impossible de récupérer l'historique du dossier via l'API Fonds Vert (${dossierResult.statusText})`,
    );
    return {
      success: false,
      error: `L'historique financier est temporairement indisponible.`,
    };
  }

  return {
    success: true,
    data: dossierResult.data.data,
  };
}
