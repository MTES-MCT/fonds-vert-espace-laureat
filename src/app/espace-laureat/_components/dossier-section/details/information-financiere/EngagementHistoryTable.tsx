import React, { ReactNode } from "react";

interface Engagement {
  annee: number;
  montant_engage: number;
  demandes_paiement: {
    numero_dp: string;
    date_dp: string;
    montant_paye: number;
  }[];
}

interface EngagementHistoryTableProps {
  sortedhistorique: Engagement[];
  formatMontant: (montant: number) => string;
  formatDate: (date: string) => string;
}

function DsfrTable({ children }: { children: ReactNode }) {
  return (
    <div className="fr-table mb-0 w-[80vw] sm:w-auto">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function EngagementHistoryTable({
  sortedhistorique,
  formatMontant,
  formatDate,
}: EngagementHistoryTableProps) {
  return (
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
                  <td>{formatDate(dp.date_dp)}</td>
                  <td>{dp.numero_dp}</td>
                </tr>
              ));
            } else {
              return (
                <tr key={`${idxItem}-0`}>
                  <td>{item.annee}</td>
                  <td>{formatMontant(item.montant_engage)}</td>
                  <td className="text-xs text-gray-500">Aucun paiement</td>
                  <td className="text-gray-300">—</td>
                  <td className="text-gray-300">—</td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </DsfrTable>
  );
}
