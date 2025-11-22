import { InformationFinanciere } from "@/services/fondsvert/dossier";

interface DemandePaiement {
  montant_paye: number;
  date_dp: string;
  numero_dp: string;
}

interface HistoriqueEngagement {
  demandes_paiement: DemandePaiement[];
  annee: number;
}

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

export function getTotalPayeFromHistorique(
  historique: HistoriqueEngagement[],
): number {
  return historique
    .flatMap((h) => h.demandes_paiement)
    .reduce((sum, dp) => sum + dp.montant_paye, 0);
}

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
