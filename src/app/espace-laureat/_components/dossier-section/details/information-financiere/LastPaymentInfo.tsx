import React from "react";

import { formatDate, formatEuros } from "@/utils/format";

interface Payment {
  montant_paye: number;
  date_dp: string;
  numero_dp: string;
}

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

interface LastPaymentInfoProps {
  group: GroupedEngagement;
  index: number;
}

export function LastPaymentInfo({ group, index }: LastPaymentInfoProps) {
  const getLastPayment = (group: GroupedEngagement) => {
    return group.historique
      .flatMap((item) => item.demandes_paiement)
      .reduce(
        (mostRecent, current) =>
          !mostRecent || current.date_dp > mostRecent.date_dp
            ? current
            : mostRecent,
        null as null | Payment,
      );
  };

  const lastPayment = getLastPayment(group);

  if (!lastPayment) {
    return (
      <div className="mb-4 text-sm font-medium text-gray-400">
        Aucun paiement n'a été réalisé pour ce projet.
      </div>
    );
  }

  return (
    <dl className="grid grid-cols-3 text-sm">
      <div>
        <dt id={`dernier-paiement-${index}-label`}>Dernier paiement</dt>
        <dd aria-labelledby={`dernier-paiement-${index}-label`}>
          {formatEuros(lastPayment.montant_paye)}
        </dd>
      </div>
      <div>
        <dt id={`date-paiement-${index}-label`}>Date de paiement</dt>
        <dd aria-labelledby={`date-paiement-${index}-label`}>
          le {formatDate(lastPayment.date_dp)}
        </dd>
      </div>
      <div>
        <dt id={`numero-demande-${index}-label`}>Numéro de demande</dt>
        <dd aria-labelledby={`numero-demande-${index}-label`}>
          {lastPayment.numero_dp}
        </dd>
      </div>
    </dl>
  );
}
