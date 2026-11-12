"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import React, { ReactNode } from "react";

import {
  type EngagementJuridiqueGroupe,
  getMontantRestant,
} from "@/utils/finance";

import { EngagementJuridiqueDetails } from "./engagement-juridique/EngagementJuridiqueDetails";
import { EngagementJuridiqueHistorique } from "./engagement-juridique/EngagementJuridiqueHistorique";
import { EtatEngagementBadge } from "./engagement-juridique/EtatEngagementBadge";

export function EngagementsJuridiquesList({
  engagementsList,
  financeFieldsSlots,
}: {
  engagementsList: EngagementJuridiqueGroupe[];
  financeFieldsSlots: { initialAmount: ReactNode; parties: ReactNode }[];
}) {
  return (
    <div className="min-w-0 space-y-8">
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
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-4">
              <h3
                id={`engagement-juridique-${index}-heading`}
                className="text-lg font-bold"
              >
                Engagement juridique n°{group.numero_ej}
              </h3>
              <EtatEngagementBadge
                etatEngagement={group.latest_etat_engagement}
              />
            </div>

            <Tabs
              tabs={[
                {
                  label: "Informations",
                  content: (
                    <EngagementJuridiqueDetails
                      group={group}
                      montantRestant={montantRestant}
                      financeFieldsSlots={financeFieldsSlots[index]}
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
