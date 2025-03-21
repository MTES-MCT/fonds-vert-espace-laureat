import { ReactNode } from "react";

import { Dossier } from "@/services/ds/subvention";
import { formatDate, formatEuros } from "@/utils/format";

interface DossiersTableProps {
  dossiers: Dossier[];
}

function DsfrTable({ children }: { children: ReactNode }) {
  return (
    <div className="fr-table--lg border-t border-l border-r">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DossiersTable({ dossiers }: DossiersTableProps) {
  return (
    <DsfrTable>
      <table>
        <thead>
          <tr>
            <th scope="col">Dossier</th>
            <th scope="col">Projet</th>
            <th scope="col">Subvention attribuée</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => (
            <tr key={dossier.numero}>
              <td>{dossier.numero}</td>
              <td className="whitespace-normal max-w-lg leading-5">
                {dossier.champs.intituleProjet}
              </td>
              <td className="leading-tight">
                <div className="text-lg font-semibold">
                  {formatEuros(dossier.champs.montantSubventionAttribuee)}
                </div>
                <div className="text-xs">
                  le {formatDate(dossier.champs.dateSignatureDecision)}
                </div>
              </td>
              <td>
                <div className="flex justify-end">
                  <a
                    className="fr-btn fr-btn--secondary"
                    href={`/espace-laureat/${dossier.numero}`}
                  >
                    Ouvrir
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DsfrTable>
  );
}
