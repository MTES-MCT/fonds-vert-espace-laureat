import { FinancesEJResult } from "@/app/espace-laureat/[dossierNumber]/page";
import { MoneyField } from "@/components/money-field/MoneyField";
import { getLatestYearPostesField } from "@/utils/finance";
import { slugify } from "@/utils/format";

function FinanceField({
  values,
  singular,
  plural,
  scope,
}: {
  values: string[];
  singular: string;
  plural: string;
  scope: string;
}) {
  if (values.length === 0) return null;

  const label = values.length > 1 ? plural : singular;
  const text = values.join(", ");
  const baseId = slugify(singular);
  const id = `${baseId}-${scope}-label`;

  return (
    <div className="max-w-[220px]">
      <dt id={id}>{label}</dt>
      <dd aria-labelledby={id} className="truncate" title={text}>
        {text}
      </dd>
    </div>
  );
}

interface FinanceFieldsSectionProps {
  numeroEJ: string;
  financesEJPromise: Promise<FinancesEJResult>;
}

export async function FinanceFieldsSection({
  numeroEJ,
  financesEJPromise,
}: FinanceFieldsSectionProps) {
  const results = await financesEJPromise;
  const ejResult = results[numeroEJ];

  if (!ejResult?.success) {
    return null;
  }

  const fournisseurs = getLatestYearPostesField(
    ejResult.data,
    "fournisseur_titulaire_nom",
  );
  const centresCouts = getLatestYearPostesField(ejResult.data, "centre_couts");

  return (
    <>
      <MoneyField
        label="Montant attribué initial"
        value={ejResult.data.montant_engage_initial}
        className="order-first"
        scope={numeroEJ}
      />
      <FinanceField
        values={fournisseurs}
        singular="Fournisseur"
        plural="Fournisseurs"
        scope={numeroEJ}
      />
      <FinanceField
        values={centresCouts}
        singular="Centre de coût"
        plural="Centres de coût"
        scope={numeroEJ}
      />
    </>
  );
}
