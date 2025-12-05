import { ReactNode } from "react";

import { MoneyField } from "@/components/money-field/MoneyField";
import { EngagementJuridiqueGroupe } from "@/utils/finance";

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
        <MoneyField
          id={`montant-attribue-ej-${index}`}
          label={`Montant attribué en ${group.latest_year}`}
          value={group.latest_montant_engage}
        />
        <MoneyField
          id={`montant-restant-ej-${index}`}
          label="Montant restant"
          value={montantRestant}
        />
        {financeFieldsSlot}
      </dl>
      <DernierPaiement group={group} index={index} />
    </>
  );
}
