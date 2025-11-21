import React from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { getTotalPayeFromHistorique } from "@/utils/finance";
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

  const engagementsList = Object.values(groupedEngagements);

  return (
    <div>
      {engagementsList.map((group, index) => {
        const isLast = index === engagementsList.length - 1;
        const sortedhistorique = [...group.historique].sort(
          (a, b) => b.annee - a.annee,
        );

        const totalPaye = getTotalPayeFromHistorique(group.historique);
        const montantRestant = group.montant_engage_initial - totalPaye;

        return (
          <section
            key={index}
            aria-labelledby={`engagement-juridique-${index}-heading`}
            className={`py-5 ${isLast ? "" : "border-b border-gray-200"}`}
          >
            <h4
              id={`engagement-juridique-${index}-heading`}
              className="mb-3 text-lg font-bold"
            >
              Engagement juridique n°{group.numero_ej}
            </h4>

            <dl className="mb-4 grid grid-cols-3 gap-y-4 text-sm">
              <div>
                <dt id={`montant-attribue-ej-${index}-label`}>
                  Montant attribué
                </dt>
                <dd aria-labelledby={`montant-attribue-ej-${index}-label`}>
                  {formatEuros(group.montant_engage_initial)}
                </dd>
              </div>
              <div>
                <dt id={`montant-restant-ej-${index}-label`}>Montant restant</dt>
                <dd aria-labelledby={`montant-restant-ej-${index}-label`}>
                  {formatEuros(montantRestant)}
                </dd>
              </div>
            </dl>

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
          </section>
        );
      })}
    </div>
  );
}
