import React from "react";

import { formatEuros } from "@/utils/format";

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
  formatDate: (date: string) => string;
}

export function LastPaymentInfo({ group, formatDate }: LastPaymentInfoProps) {
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
      <div className="text-sm text-gray-400 font-medium mb-4">
        Aucun paiement n'a été réalisé pour ce projet.
      </div>
    );
  }

  return (
    <dl className="flex flex-wrap text-sm gap-x-8 gap-y-4 mb-8">
      <div>
        <dt>Dernier paiement</dt>
        <dd>{formatEuros(lastPayment.montant_paye)}</dd>
      </div>
      <div>
        <dt>Date de paiement</dt>
        <dd>{formatDate(lastPayment.date_dp)}</dd>
      </div>
      <div>
        <dt>Numéro de demande</dt>
        <dd>{lastPayment.numero_dp}</dd>
      </div>
    </dl>
  );
}
