/**
 * Ce module transforme les données financières de l'API Fonds Vert pour l'affichage.
 * Ces données proviennent de deux endpoints :
 *
 * - `/dossier/{numero}` : infos financières par année/EJ avec les demandes de paiement.
 * - `/finances/{numeroEJ}` : détails des postes d'un EJ (fournisseur, centre de coûts, etc).
 */

import {
  DemandePaiement,
  InformationFinanciere,
} from "@/services/fondsvert/dossier";
import { FinancesEJData, PosteEJ } from "@/services/fondsvert/finances";

// ============================================================================
// 1. Données financières issues de `/dossier/{numero}`
// ============================================================================

export interface EngagementJuridiqueAnnee {
  demandes_paiement: DemandePaiement[];
  annee: number;
  montant_engage: number;
}

export interface EngagementJuridiqueGroupe {
  numero_ej: string;
  latest_montant_engage: number;
  latest_year: number;
  historique: EngagementJuridiqueAnnee[];
}

/**
 * Calcule le montant total payé pour afficher le "montant versé".
 * L'API ne fournit pas ce total directement, on parcourt donc toutes les demandes
 * de paiement (années → EJ → demandes_paiement) et on somme les montant_paye.
 */
export function getMontantTotalPaye(
  informationFinanciere?: InformationFinanciere,
): number {
  if (!informationFinanciere?.informations_engagement) {
    return 0;
  }

  return informationFinanciere.informations_engagement
    .flatMap((info) =>
      info.engagements_juridiques.flatMap((eng) => eng.demandes_paiement),
    )
    .reduce((sum, dp) => sum + dp.montant_paye, 0);
}

/**
 * Trie les années par ordre décroissant et les paiements par date décroissante,
 * pour afficher les plus récents en premier.
 */
function sortHistoriqueByDate(
  historique: EngagementJuridiqueAnnee[],
): EngagementJuridiqueAnnee[] {
  return [...historique]
    .map((item) => ({
      ...item,
      demandes_paiement: [...item.demandes_paiement].sort((a, b) =>
        b.date_dp.localeCompare(a.date_dp),
      ),
    }))
    .sort((a, b) => b.annee - a.annee);
}

/**
 * Regroupe les engagements par numéro EJ. L'API retournant les données par année,
 * on les réorganise ici par EJ avec l'historique complet des montant_engage.
 * L'historique est trié par année décroissante (plus récent en premier).
 */
export function groupEngagementsByEJ(
  informationFinanciere: InformationFinanciere,
): EngagementJuridiqueGroupe[] {
  const grouped = informationFinanciere.informations_engagement.reduce(
    (acc, info) => {
      info.engagements_juridiques.forEach((eng) => {
        const key = eng.numero_ej;
        if (!acc[key]) {
          acc[key] = {
            numero_ej: eng.numero_ej,
            latest_montant_engage: eng.montant_engage,
            latest_year: info.annee_information_financiere,
            historique: [],
          };
        }
        if (info.annee_information_financiere > acc[key].latest_year) {
          acc[key].latest_montant_engage = eng.montant_engage;
          acc[key].latest_year = info.annee_information_financiere;
        }
        acc[key].historique.push({
          annee: info.annee_information_financiere,
          montant_engage: eng.montant_engage,
          demandes_paiement: eng.demandes_paiement,
        });
      });
      return acc;
    },
    {} as Record<string, EngagementJuridiqueGroupe>,
  );

  return Object.values(grouped).map((group) => ({
    ...group,
    historique: sortHistoriqueByDate(group.historique),
  }));
}

/**
 * Calcule le montant restant à verser pour un engagement (montant_engage - paiements).
 * Utilise l'année la plus récente, car le montant_engage peut évoluer dans le temps.
 */
export function getMontantRestant(
  historique: EngagementJuridiqueAnnee[],
  latestYear: number,
  latestMontantEngage: number,
): number {
  const latestYearHistorique = historique.find((h) => h.annee === latestYear);
  const latestYearPayments = latestYearHistorique
    ? latestYearHistorique.demandes_paiement.reduce(
        (sum, dp) => sum + dp.montant_paye,
        0,
      )
    : 0;
  return latestMontantEngage - latestYearPayments;
}

/**
 * Trouve le paiement le plus récent parmi tous les paiements d'un engagement.
 */
export function getLastPayment(
  group: EngagementJuridiqueGroupe,
): DemandePaiement | null {
  return group.historique
    .flatMap((item) => item.demandes_paiement)
    .reduce(
      (mostRecent, current) =>
        !mostRecent || current.date_dp > mostRecent.date_dp
          ? current
          : mostRecent,
      null as DemandePaiement | null,
    );
}

// ============================================================================
// 2. Détails financiers de l'EJ issus de `/finances/{numeroEJ}`
// ============================================================================

/**
 * Extrait les valeurs uniques d'un champ depuis les postes de l'année la plus récente.
 * Utilisé par exemple pour afficher les fournisseurs ou les centres de coûts.
 */
export function getLatestYearPostesField(
  financesEJ: FinancesEJData | undefined,
  fieldName: keyof PosteEJ,
): string[] {
  if (!financesEJ?.annees_informations_financieres?.length) return [];

  const latestYear = financesEJ.annees_informations_financieres.reduce(
    (latest, current) =>
      current.annee_information_financiere > latest.annee_information_financiere
        ? current
        : latest,
  );

  const values = latestYear.postes
    .map((poste) => poste[fieldName])
    .filter((v): v is string => typeof v === "string" && Boolean(v));

  return [...new Set(values)];
}

/**
 * Extrait les numéros EJ uniques depuis les informations financières.
 * Utilisé pour déclencher les appels `/finances/{ej}` en parallèle.
 */
export function extractEJNumbers(
  informationFinanciere?: InformationFinanciere,
): string[] {
  if (!informationFinanciere?.informations_engagement) {
    return [];
  }

  const allEJs = informationFinanciere.informations_engagement
    .flatMap((info) => info.engagements_juridiques)
    .map((ej) => ej.numero_ej);

  return [...new Set(allEJs)];
}
