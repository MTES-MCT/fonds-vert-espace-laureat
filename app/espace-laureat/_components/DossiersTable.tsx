import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { ReactNode } from "react";

import { Dossier } from "@/services/ds/subvention";

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

function formatMontant(montant: number | undefined) {
  return montant
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(montant)
    : "N/A";
}

function formatDate(date?: Date) {
  if (!date) return "Non disponible";
  return `le ${format(date, "dd MMMM yyyy", { locale: fr })}`;
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
          {dossiers.map((dossier, index) => {
            const numero = dossier.numero;
            const date = dossier.champs.dateSignatureDecision
              ? new Date(dossier.champs.dateSignatureDecision)
              : undefined;
            return (
              <tr key={index}>
                <td>{numero}</td>
                <td className="whitespace-normal max-w-lg leading-5">
                  {dossier.champs.intituleProjet}
                </td>
                <td className="leading-tight">
                  <div className="text-lg font-semibold">
                    {formatMontant(dossier.champs.montantSubventionAttribuee)}
                  </div>
                  <div className="text-xs">{formatDate(date)}</div>
                </td>
                <td>
                  <div className="flex justify-end">
                    <a
                      className="fr-btn fr-btn--secondary"
                      href={`/espace-laureat/${numero}`}
                    >
                      Ouvrir
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DsfrTable>
  );
}
