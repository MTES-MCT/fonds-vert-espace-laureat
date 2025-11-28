import {
  DemandePaiement,
  InformationFinanciere,
} from "@/services/fondsvert/dossier";
import { FinancesEJData, PosteEJ } from "@/services/fondsvert/finances";

export interface EngagementJuridiqueAnnee {
  demandes_paiement: DemandePaiement[];
  annee: number;
  montant_engage: number;
}

export interface EngagementJuridiqueGroupe {
  numero_ej: string;
  montant_engage_initial: number;
  latest_montant_engage: number;
  latest_year: number;
  historique: EngagementJuridiqueAnnee[];
}

/**
 * Calcule le montant total payé à partir de toutes les demandes de paiement
 * de tous les engagements juridiques dans les informations financières.
 * Utilisé pour afficher le montant total versé pour un dossier.
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
 * Groupe les engagements juridiques par numéro EJ et montant initial.
 * Pour chaque groupe, calcule les valeurs de l'année la plus récente.
 */
export function groupEngagementsByEJ(
  informationFinanciere: InformationFinanciere,
): EngagementJuridiqueGroupe[] {
  const grouped = informationFinanciere.informations_engagement.reduce(
    (acc, info) => {
      info.engagements_juridiques.forEach((eng) => {
        const key = `${eng.numero_ej}-${eng.montant_engage_initial}`;
        if (!acc[key]) {
          acc[key] = {
            numero_ej: eng.numero_ej,
            montant_engage_initial: eng.montant_engage_initial,
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

  return Object.values(grouped);
}

/**
 * Calcule le montant restant pour un engagement juridique.
 * Basé sur le montant engagé de l'année la plus récente moins les paiements de cette année.
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
 * Trie les entrées de l'historique d'engagement par année (décroissant)
 * et par date de paiement (décroissant). Les années et paiements les plus récents apparaissent en premier.
 */
export function sortEngagementJuridiqueAnnees(
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
 * Extrait les valeurs uniques d'un champ depuis tous les postes de l'année la plus récente.
 * Utilisé pour afficher les détails financiers (centre financier, fournisseur, centre de coût).
 * Retourne un tableau de valeurs uniques.
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
