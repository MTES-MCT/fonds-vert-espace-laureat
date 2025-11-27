import { FinancesEJData } from "@/services/fondsvert/finances";
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

function getCentresFinanciers(financesEJ?: FinancesEJData): string | undefined {
  if (!financesEJ?.annees_informations_financieres?.length) return undefined;
  const allCentres = financesEJ.annees_informations_financieres
    .flatMap((annee) => annee.postes)
    .map((poste) => poste.centre_financier)
    .filter(Boolean);
  const uniqueCentres = [...new Set(allCentres)];
  return uniqueCentres.length > 0 ? uniqueCentres.join(", ") : undefined;
}

export function EngagementInfos({
  group,
  montantRestant,
  index,
  financesEJ,
}: {
  group: GroupedEngagement;
  montantRestant: number;
  index: number;
  financesEJ?: FinancesEJData;
}) {
  const centresFinanciers = getCentresFinanciers(financesEJ);

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
        {centresFinanciers && (
          <div>
            <dt id={`centre-financier-ej-${index}-label`}>Centre financier</dt>
            <dd aria-labelledby={`centre-financier-ej-${index}-label`}>
              {centresFinanciers}
            </dd>
          </div>
        )}
      </dl>
      <LastPaymentInfo group={group} index={index} />
    </>
  );
}
