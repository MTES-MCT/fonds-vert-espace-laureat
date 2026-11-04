import { FactRow } from "@/components/fact-list/FactList";
import { MoneyField } from "@/components/money-field/MoneyField";
import { EngagementJuridiqueGroupe, getLastPayment } from "@/utils/finance";
import { formatDate } from "@/utils/format";

interface DernierPaiementProps {
  group: EngagementJuridiqueGroupe;
  scope: string;
}

export function DernierPaiement({ group, scope }: DernierPaiementProps) {
  const lastPayment = getLastPayment(group);

  if (!lastPayment) {
    return (
      <FactRow id={`dernier-paiement-${scope}-label`} label="Dernier paiement">
        Aucun paiement n'a été réalisé.
      </FactRow>
    );
  }

  return (
    <>
      <MoneyField
        label="Dernier paiement"
        value={lastPayment.montant_paye}
        scope={scope}
      />
      <FactRow id={`date-paiement-${scope}-label`} label="Date de paiement">
        le {formatDate(lastPayment.date_dp)}
      </FactRow>
      <FactRow id={`numero-demande-${scope}-label`} label="Numéro de demande">
        {lastPayment.numero_dp}
      </FactRow>
    </>
  );
}
