import React, { ReactNode } from "react";

import type { EngagementJuridiqueAnnee } from "@/utils/finance";
import { formatDate, formatEuros } from "@/utils/format";

interface EngagementHistoryTableProps {
  sortedhistorique: EngagementJuridiqueAnnee[];
}

function DsfrTable({ children }: { children: ReactNode }) {
  return (
    <div className="fr-table mt-0 mb-0 w-full max-w-full">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function EngagementJuridiqueHistorique({
  sortedhistorique,
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
                  <td>{formatEuros(item.montant_engage)}</td>
                  <td>{formatEuros(dp.montant_paye)}</td>
                  <td>le {formatDate(dp.date_dp)}</td>
                  <td>{dp.numero_dp}</td>
                </tr>
              ));
            } else {
              return (
                <tr key={`${idxItem}-0`}>
                  <td>{item.annee}</td>
                  <td>{formatEuros(item.montant_engage)}</td>
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
