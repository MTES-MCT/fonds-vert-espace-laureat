import { InformationFinanciere } from "@/services/fondsvert/dossier";

interface DemandePaiement {
  montant_paye: number;
}

interface HistoriqueEngagement {
  demandes_paiement: DemandePaiement[];
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
