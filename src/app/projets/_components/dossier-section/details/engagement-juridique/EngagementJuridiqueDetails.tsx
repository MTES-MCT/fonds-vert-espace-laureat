import { ReactNode } from "react";

import { FactList } from "@/components/fact-list/FactList";
import { MoneyField } from "@/components/money-field/MoneyField";
import { EngagementJuridiqueGroupe } from "@/utils/finance";

import { DernierPaiement } from "./DernierPaiement";

export function EngagementJuridiqueDetails({
  group,
  montantRestant,
  financeFieldsSlots,
}: {
  group: EngagementJuridiqueGroupe;
  montantRestant: number;
  financeFieldsSlots: { initialAmount: ReactNode; parties: ReactNode };
}) {
  const scope = group.numero_ej;

  return (
    <FactList framed={false} className="-my-3 md:-mx-4">
      {financeFieldsSlots.initialAmount}
      <MoneyField
        label={`Montant attribué en ${group.latest_year}`}
        value={group.latest_montant_engage}
        scope={scope}
      />
      <MoneyField
        label="Montant restant"
        value={montantRestant}
        scope={scope}
      />
      {financeFieldsSlots.parties}
      <DernierPaiement group={group} scope={scope} />
    </FactList>
  );
}
