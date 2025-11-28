"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { FinancesEJData } from "@/services/fondsvert/finances";
import {
  getMontantRestant,
  groupEngagementsByEJ,
  sortHistoriqueByYearAndPaymentDate,
} from "@/utils/finance";

import { EngagementJuridiqueHistorique } from "./engagement-juridique/EngagementJuridiqueHistorique";
import { EngagementJuridiqueDetails } from "./engagement-juridique/EngagementJuridiqueDetails";

export function EngagementsJuridiquesList({
  informationFinanciere,
  financesEJMap,
}: {
  informationFinanciere: InformationFinanciere;
  financesEJMap: Record<string, FinancesEJData>;
}) {
  const engagementsList = groupEngagementsByEJ(informationFinanciere);

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
                    <EngagementJuridiqueDetails
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
                    <EngagementJuridiqueHistorique
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
