import { URLSearchParams } from "url";

import {
  type FondsVertSignals,
  isRecord,
  readFondsVertSignals,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";
import { fetchFondsVert } from "@/services/fondsvert/helpers";

const defaultDossierSearchParams = {
  include_finances: "true",
  include_anomalies: "true",
  type_export: "JSON",
};

export type MetricValue = number | string | boolean | string[];

export type MetricFields = {
  label: string;
  unite: string | null;
  valeur_estimee: MetricValue;
};

export type SimpleMetric = MetricFields & {
  metricCode: string;
};

export type Metrics = Record<string, unknown>;

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

function readDossierResponse(value: unknown) {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const data = value.data;
  return {
    data: data as DossierFondsVert,
    signals: readFondsVertSignals(data),
  };
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
  | { success: false; error: string; signals: FondsVertSignals }
  | {
      success: true;
      data: DossierFondsVert;
      metricsStatus: "loaded" | "unavailable" | "not-requested";
      signals: FondsVertSignals;
    }
> {
  const params = new URLSearchParams({
    ...defaultDossierSearchParams,
    include_metrics: String(includeMetrics),
  });

  const dossierResult = await fetchFondsVert<unknown>(
    `v2/dossiers/${numeroDossier}?${params.toString()}`,
  );

  if (!dossierResult.success) {
    if (dossierResult.status === 404) {
      return {
        success: false,
        error: "Impossible de trouver les détails pour ce dossier",
        signals: unavailableFondsVertSignals(),
      };
    }

    if (dossierResult.status === 422 && includeMetrics) {
      const paramsWithoutMetrics = new URLSearchParams({
        ...defaultDossierSearchParams,
        include_metrics: "false",
      });

      const retryResult = await fetchFondsVert<unknown>(
        `v2/dossiers/${numeroDossier}?${paramsWithoutMetrics.toString()}`,
      );

      const retry = retryResult.success
        ? readDossierResponse(retryResult.data)
        : null;
      if (retry) {
        return {
          success: true,
          data: {
            ...retry.data,
            metrique_specifique: undefined,
          },
          metricsStatus: "unavailable",
          signals: retry.signals,
        };
      }

      return {
        success: false,
        error:
          "L'historique n'est pas encore disponible pour ce type de démarche.",
        signals: unavailableFondsVertSignals(),
      };
    }

    console.error(
      `Impossible de récupérer l'historique du dossier via l'API Fonds Vert (${dossierResult.statusText})`,
    );
    return {
      success: false,
      error: `L'historique financier est temporairement indisponible.`,
      signals: unavailableFondsVertSignals(),
    };
  }

  const response = readDossierResponse(dossierResult.data);
  if (!response) {
    return {
      success: false,
      error: "L'historique financier est temporairement indisponible.",
      signals: unavailableFondsVertSignals(),
    };
  }
  const { data, signals } = response;

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
    signals,
  };
}
