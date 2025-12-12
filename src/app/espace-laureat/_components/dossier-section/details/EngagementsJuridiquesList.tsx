"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { ReactNode } from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { getMontantRestant, groupEngagementsByEJ } from "@/utils/finance";

import { EngagementJuridiqueDetails } from "./engagement-juridique/EngagementJuridiqueDetails";
import { EngagementJuridiqueHistorique } from "./engagement-juridique/EngagementJuridiqueHistorique";

export function EngagementsJuridiquesList({
  informationFinanciere,
  financeFieldsSlots,
}: {
  informationFinanciere: InformationFinanciere;
  financeFieldsSlots: ReactNode[];
}) {
  const engagementsList = groupEngagementsByEJ(informationFinanciere);

  return (
    <div className="space-y-8">
      {engagementsList.map((group, index) => {
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
                      financeFieldsSlot={financeFieldsSlots[index]}
                    />
                  ),
                },
                {
                  label: "Historique",
                  content: (
                    <EngagementJuridiqueHistorique
                      sortedhistorique={group.historique}
                    />
                  ),
                },
                {
                  label: "Contact",
                  content: (
                    <p className="mb-0">
                      Voir les informations dans votre convention / arrêté.
                    </p>
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
