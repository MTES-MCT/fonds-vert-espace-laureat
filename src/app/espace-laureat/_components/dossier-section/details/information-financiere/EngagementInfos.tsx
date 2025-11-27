import { FinancesEJData } from "@/services/fondsvert/finances";
import { getLatestYearPostesField, GroupedEngagement } from "@/utils/finance";
import { formatEuros } from "@/utils/format";

import { LastPaymentInfo } from "./LastPaymentInfo";

function FinanceField({
  id,
  values,
  singular,
  plural,
}: {
  id: string;
  values: string[];
  singular: string;
  plural: string;
}) {
  if (values.length === 0) return null;

  const label = values.length > 1 ? plural : singular;

  return (
    <div>
      <dt id={`${id}-label`}>{label}</dt>
      <dd aria-labelledby={`${id}-label`}>{values.join(", ")}</dd>
    </div>
  );
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
  const fournisseurs = getLatestYearPostesField(
    financesEJ,
    "fournisseur_titulaire_nom",
  );
  const centresCouts = getLatestYearPostesField(financesEJ, "centre_couts");

  return (
    <>
      <dl className="mb-4 grid grid-cols-3 gap-y-4 text-sm">
        <div>
          <dt id={`montant-attribue-initial-ej-${index}-label`}>
            Montant attribué initial
          </dt>
          <dd aria-labelledby={`montant-attribue-initial-ej-${index}-label`}>
            {formatEuros(group.montant_engage_initial)}
          </dd>
        </div>
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
        <FinanceField
          id={`fournisseur-ej-${index}`}
          values={fournisseurs}
          singular="Fournisseur"
          plural="Fournisseurs"
        />
        <FinanceField
          id={`centre-cout-ej-${index}`}
          values={centresCouts}
          singular="Centre de coût"
          plural="Centres de coût"
        />
      </dl>
      <LastPaymentInfo group={group} index={index} />
    </>
  );
}
