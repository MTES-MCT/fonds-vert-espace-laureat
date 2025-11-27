"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { FinancesEJData } from "@/services/fondsvert/finances";
import {
  getMontantRestant,
  sortHistoriqueByYearAndPaymentDate,
} from "@/utils/finance";

import { EngagementHistoryTable } from "./information-financiere/EngagementHistoryTable";
import { EngagementInfos } from "./information-financiere/EngagementInfos";

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
  latest_montant_engage: number;
  latest_year: number;
  historique: Engagement[];
}

export function InformationFinanciereTimeline({
  informationFinanciere,
  financesEJMap,
}: {
  informationFinanciere: InformationFinanciere;
  financesEJMap: Record<string, FinancesEJData>;
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
              latest_montant_engage: eng.montant_engage,
              latest_year: info.annee_information_financiere,
              historique: [],
            } as GroupedEngagement;
          }
          // Update latest values if this year is more recent
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
      {} as Record<string, GroupedEngagement>,
    );

  const engagementsList = Object.values(groupedEngagements);

  return (
    <div className="space-y-8">
      {engagementsList.map((group, index) => {
        const sortedhistorique = sortHistoriqueByYearAndPaymentDate(
          group.historique,
        );

        const montantRestant = getMontantRestant(
          group.historique,
          group.latest_year,
          group.latest_montant_engage,
        );

        return (
          <section
            key={index}
            aria-labelledby={`engagement-juridique-${index}-heading`}
          >
            <h4
              id={`engagement-juridique-${index}-heading`}
              className="mb-3 text-lg font-bold"
            >
              Engagement juridique n°{group.numero_ej}
            </h4>

            <Tabs
              tabs={[
                {
                  label: "Informations",
                  content: (
                    <EngagementInfos
                      group={group}
                      montantRestant={montantRestant}
                      index={index}
                      financesEJ={financesEJMap[group.numero_ej]}
                    />
                  ),
                },
                {
                  label: "Historique",
                  content: (
                    <EngagementHistoryTable
                      sortedhistorique={sortedhistorique}
                    />
                  ),
                },
              ]}
            />
          </section>
        );
      })}
    </div>
  );
}
