import { ReactNode } from "react";

import { EngagementJuridiqueGroupe } from "@/utils/finance";
import { formatEuros } from "@/utils/format";

import { DernierPaiement } from "./DernierPaiement";

export function EngagementJuridiqueDetails({
  group,
  montantRestant,
  index,
  financeFieldsSlot,
}: {
  group: EngagementJuridiqueGroupe;
  montantRestant: number;
  index: number;
  financeFieldsSlot: ReactNode;
}) {
  return (
    <>
      <dl className="mb-4 grid grid-cols-3 gap-y-4 text-sm">
        <div>
          <dt id={`montant-attribue-ej-${index}-label`}>
            Montant attribué en {group.latest_year}
          </dt>
          <dd aria-labelledby={`montant-attribue-ej-${index}-label`}>
            {formatEuros(group.latest_montant_engage)}
          </dd>
        </div>
        <div>
          <dt id={`montant-restant-ej-${index}-label`}>Montant restant</dt>
          <dd aria-labelledby={`montant-restant-ej-${index}-label`}>
            {formatEuros(montantRestant)}
          </dd>
        </div>
        {financeFieldsSlot}
      </dl>
      <DernierPaiement group={group} index={index} />
    </>
  );
}
