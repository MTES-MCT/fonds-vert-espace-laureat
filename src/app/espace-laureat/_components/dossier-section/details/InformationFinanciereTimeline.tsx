import React from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { formatDate, formatEuros } from "@/utils/format";

import { EngagementHistoryTable } from "./information-financiere/EngagementHistoryTable";
import { LastPaymentInfo } from "./information-financiere/LastPaymentInfo";

interface Engagement {
  annee: number;
  montant_engage: number;
  demandes_paiement: {
    numero_dp: string;
    date_dp: string;
    montant_paye: number;
  }[];
}

interface GroupedEngagement {
  numero_ej: string;
  montant_engage_initial: number;
  historique: Engagement[];
}

export function InformationFinanciereTimeline({
  informationFinanciere,
}: {
  informationFinanciere: InformationFinanciere;
}) {
  const groupedEngagements =
    informationFinanciere.informations_engagement.reduce(
      (acc, info) => {
        info.engagements_juridiques.forEach((eng) => {
          const key = `${eng.numero_ej}-${eng.montant_engage_initial}`;
          if (!acc[key]) {
            acc[key] = {
              numero_ej: eng.numero_ej,
              montant_engage_initial: eng.montant_engage_initial,
              historique: [],
            } as GroupedEngagement;
          }
          acc[key].historique.push({
            annee: info.annee_information_financiere,
            montant_engage: eng.montant_engage,
            demandes_paiement: eng.demandes_paiement,
          });
        });
        return acc;
      },
      {} as Record<string, GroupedEngagement>,
    );

  return (
    <div>
      {Object.values(groupedEngagements).map((group, index) => {
        const sortedhistorique = [...group.historique].sort(
          (a, b) => b.annee - a.annee,
        );

        return (
          <div key={index} className="mt-5 max-w-3xl">
            <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div>
                <dt>Engagés pour {sortedhistorique[0].annee}</dt>
                <dd>{formatEuros(sortedhistorique[0].montant_engage)}</dd>
              </div>
              <div>
                <dt>Numéro d'engagement juridique</dt>
                <dd>{group.numero_ej}</dd>
              </div>
            </dl>

            <div>
              <LastPaymentInfo group={group} formatDate={formatDate} />

              <details>
                <summary className="fr-link--sm fr-link fr-text--sm list-item">
                  Voir l'historique des engagements
                </summary>
                <EngagementHistoryTable
                  sortedhistorique={sortedhistorique}
                  formatDate={formatDate}
                />
              </details>
            </div>
          </div>
        );
      })}
    </div>
  );
}
