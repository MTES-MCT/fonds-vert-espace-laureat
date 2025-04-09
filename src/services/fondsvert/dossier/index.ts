import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_metrics: "true",
  include_finances: "true",
  type_export: "JSON",
};

export type MetricValue = number | string | null;

export type MetricFields = {
  label: string;
  unite: string | null;
  valeur_estimee: MetricValue;
  valeur_reelle: MetricValue;
};

export type SimpleMetric = {
  _typename: "Simple";
  label: string;
  unite: string | null;
  valeur_estimee: MetricValue;
  valeur_reelle: MetricValue;
};

export type AvantApresTravaux = {
  _typename: "AvantApresTravaux";
  label: string;
  unite: string | null;
  valeur_avant_travaux: MetricValue;
  valeur_apres_travaux_estimee: MetricValue;
  valeur_apres_travaux_reelle: MetricValue;
};

export type ProcessedMetric = SimpleMetric | AvantApresTravaux;

export type Metrics = Record<string, MetricFields>;

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

  const data = dossierResult.data.data;

  // Supprime les champs metriques avec du type Array (non supporté à ce jour)
  const filteredMetriqueSpecifique =
    data.metrique_specifique &&
    Object.entries(data.metrique_specifique).reduce((acc, [key, value]) => {
      if (Array.isArray(value) || Array.isArray(value.valeur_estimee)) {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {} as Metrics);

  return {
    success: true,
    data: {
      ...data,
      metrique_specifique: filteredMetriqueSpecifique,
    },
  };
}
