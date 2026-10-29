import { ReactNode } from "react";

import { MoneyField } from "@/components/money-field/MoneyField";
import { EngagementJuridiqueGroupe } from "@/utils/finance";

import { DernierPaiement } from "./DernierPaiement";

export function EngagementJuridiqueDetails({
  group,
  montantRestant,
  financeFieldsSlot,
}: {
  group: EngagementJuridiqueGroupe;
  montantRestant: number;
  financeFieldsSlot: ReactNode;
}) {
  const scope = group.numero_ej;

  return (
    <>
      <dl className="mb-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
        {financeFieldsSlot}
      </dl>
      <DernierPaiement group={group} scope={scope} />
    </>
  );
}
