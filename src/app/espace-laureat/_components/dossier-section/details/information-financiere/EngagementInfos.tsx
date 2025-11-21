import { formatEuros } from "@/utils/format";

import { LastPaymentInfo } from "./LastPaymentInfo";

interface Engagement {
  annee: number;
  montant_engage: number;
  demandes_paiement: {
    numero_dp: string;
    date_dp: string;
    montant_paye: number;
  }[];
}

interface GroupedEngagement {
  numero_ej: string;
  montant_engage_initial: number;
  historique: Engagement[];
}

export function EngagementInfos({
  group,
  montantRestant,
  index,
}: {
  group: GroupedEngagement;
  montantRestant: number;
  index: number;
}) {
  return (
    <>
      <dl className="mb-4 grid grid-cols-3 gap-y-4 text-sm">
        <div>
          <dt id={`montant-attribue-ej-${index}-label`}>Montant attribué</dt>
          <dd aria-labelledby={`montant-attribue-ej-${index}-label`}>
            {formatEuros(group.montant_engage_initial)}
          </dd>
        </div>
        <div>
          <dt id={`montant-restant-ej-${index}-label`}>Montant restant</dt>
          <dd aria-labelledby={`montant-restant-ej-${index}-label`}>
            {formatEuros(montantRestant)}
          </dd>
        </div>
      </dl>
      <LastPaymentInfo group={group} />
    </>
  );
}
