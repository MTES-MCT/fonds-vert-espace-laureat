import { URLSearchParams } from "url";

import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_finances: "true",
  type_export: "JSON",
};

export type MetricValue = number | string | boolean | string[];

export type MetricFields = {
  label: string;
  unite: string | null;
  valeur_estimee: MetricValue;
};

export type SimpleMetric = {
  _typename: "Simple";
  label: string;
  unite: string | null;
  valeur_estimee: MetricValue;
};

export type AvantApresTravaux = {
  _typename: "AvantApresTravaux";
  label: string;
  unite: string | null;
  valeur_avant_travaux: MetricValue;
  valeur_apres_travaux: MetricValue;
};

export type ProcessedMetric = SimpleMetric | AvantApresTravaux;

export type Metrics = Record<string, unknown>;

function isMetricValue(value: unknown): value is MetricValue {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

export function isMetricFields(value: unknown): value is MetricFields {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "unite" in value &&
    "valeur_estimee" in value &&
    typeof value.label === "string" &&
    value.label.length > 0 &&
    (value.unite === null || typeof value.unite === "string") &&
    isMetricValue(value.valeur_estimee)
  );
}

export interface DemandePaiement {
  numero_dp: string;
  date_dp: string;
  montant_paye: number;
}

export interface EngagementJuridiques {
  numero_ej: string;
  nom_demarche: string;
  nom_axe: number;
  montant_engage: number;
  demandes_paiement: DemandePaiement[];
}

export type EtatEngagement =
  | "en cours"
  | "inconnu"
  | "non démarré"
  | "soldé"
  | "clos"
  | "sans paiement";

export interface InformationsEngagement {
  annee_information_financiere: number;
  montant_paye_per_dossier: number | null;
  etat_engagement: EtatEngagement;
  engagements_juridiques: EngagementJuridiques[];
}

export interface InformationFinanciere {
  informations_engagement: InformationsEngagement[];
}

export interface SocleCommun {
  demarche_title: string;
  date_depot: string | null;
  date_notification: string | null;
  date_derniere_modification: string | null;
  statut_realisation_projet?: string | null;
  date_debut_execution: string | null;
  date_fin_execution: string | null;
  total_des_depenses: number;
  montant_subvention_attribuee?: number;
  annee_millesime?: number;
  entreprise_raison_sociale?: string;
  siret?: string;
  nom_commune?: string;
}

export interface DossierFondsVert {
  metrique_specifique?: Metrics;
  information_financiere?: InformationFinanciere;
  socle_commun?: SocleCommun;
}

function requestedMetrics({
  metrics,
  includeMetrics,
}: {
  metrics: Metrics | undefined;
  includeMetrics: boolean;
}): Metrics | undefined {
  if (!includeMetrics) {
    return undefined;
  }

  if (!metrics) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metrics).filter(([, value]) => value !== null),
  );
}

export async function getDossierFondsVert({
  numeroDossier,
  includeMetrics,
}: {
  numeroDossier: number;
  includeMetrics: boolean;
}): Promise<
  | { success: false; error: string }
  | {
      success: true;
      data: DossierFondsVert;
      metricsStatus: "loaded" | "unavailable" | "not-requested";
    }
> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
    include_metrics: String(includeMetrics),
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

    if (dossierResult.status === 422 && includeMetrics) {
      const paramsWithoutMetrics = new URLSearchParams({
        ...defaultDossierSearchParams,
        include_metrics: "false",
      });

      const retryResult = await fetchFondsVert<{ data: DossierFondsVert }>(
        `v2/dossiers/${numeroDossier}?${paramsWithoutMetrics.toString()}`,
      );

      if (retryResult.success) {
        const retryData = retryResult.data.data;
        return {
          success: true,
          data: {
            ...retryData,
            metrique_specifique: undefined,
          },
          metricsStatus: "unavailable",
        };
      }

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

  return {
    success: true,
    data: {
      ...data,
      metrique_specifique: requestedMetrics({
        metrics: data.metrique_specifique,
        includeMetrics,
      }),
    },
    metricsStatus: includeMetrics ? "loaded" : "not-requested",
  };
}
