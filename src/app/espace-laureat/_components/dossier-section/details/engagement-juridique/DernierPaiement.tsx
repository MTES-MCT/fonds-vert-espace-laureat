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
      <div className="text-sm font-medium text-gray-400">
        Aucun paiement n'a été réalisé.
      </div>
    );
  }

  return (
    <dl className="grid grid-cols-3 text-sm">
      <MoneyField
        label="Dernier paiement"
        value={lastPayment.montant_paye}
        scope={scope}
      />
      <div>
        <dt id={`date-paiement-${scope}-label`}>Date de paiement</dt>
        <dd aria-labelledby={`date-paiement-${scope}-label`}>
          le {formatDate(lastPayment.date_dp)}
        </dd>
      </div>
      <div>
        <dt id={`numero-demande-${scope}-label`}>Numéro de demande</dt>
        <dd aria-labelledby={`numero-demande-${scope}-label`}>
          {lastPayment.numero_dp}
        </dd>
      </div>
    </dl>
  );
}
