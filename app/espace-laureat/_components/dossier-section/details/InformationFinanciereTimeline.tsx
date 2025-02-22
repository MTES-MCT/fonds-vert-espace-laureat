import React from "react";
import { ReactNode } from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";

function DsfrTable({ children }: { children: ReactNode }) {
  return (
    <div className="fr-table mb-0">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

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
  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(montant);

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
            <h3 className="text-lg font-bold mb-2">
              Engagement juridique n°{group.numero_ej}
            </h3>
            <DsfrTable>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Année</th>
                    <th scope="col">Montant engagé</th>
                    <th scope="col">Montant payé</th>
                    <th scope="col">Date de demande</th>
                    <th scope="col">Numéro de demande</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedhistorique.flatMap((item, idxItem) => {
                    if (item.demandes_paiement.length > 0) {
                      return item.demandes_paiement.map((dp, idxDp) => (
                        <tr key={`${idxItem}-${idxDp}`}>
                          <td>{item.annee}</td>
                          <td>{formatMontant(item.montant_engage)}</td>
                          <td>{formatMontant(dp.montant_paye)}</td>
                          <td>
                            {new Date(dp.date_dp).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </td>
                          <td>{dp.numero_dp}</td>
                        </tr>
                      ));
                    } else {
                      return (
                        <tr key={`${idxItem}-0`}>
                          <td>{item.annee}</td>
                          <td>{formatMontant(item.montant_engage)}</td>
                          <td className="text-xs text-gray-500">
                            Aucun paiement
                          </td>
                          <td className="text-gray-300">—</td>
                          <td className="text-gray-300">—</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </DsfrTable>
          </div>
        );
      })}
    </div>
  );
}
