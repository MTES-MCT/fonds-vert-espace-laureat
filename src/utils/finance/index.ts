import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { FinancesEJData, PosteEJ } from "@/services/fondsvert/finances";

interface DemandePaiement {
  montant_paye: number;
  date_dp: string;
  numero_dp: string;
}

interface HistoriqueEngagement {
  demandes_paiement: DemandePaiement[];
  annee: number;
  montant_engage: number;
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
 * Calcule le montant restant pour un engagement juridique.
 * Basé sur le montant engagé de l'année la plus récente moins les paiements de cette année.
 */
export function getMontantRestant(
  historique: HistoriqueEngagement[],
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
export function sortHistoriqueByYearAndPaymentDate<
  T extends { annee: number; demandes_paiement: DemandePaiement[] },
>(historique: T[]): T[] {
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
