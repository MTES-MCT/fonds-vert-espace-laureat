import { FinancesEJResult } from "@/app/espace-laureat/[dossierNumber]/page";
import { MoneyField } from "@/components/money-field/MoneyField";
import { getLatestYearPostesField } from "@/utils/finance";

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
  const text = values.join(", ");

  return (
    <div className="max-w-[220px]">
      <dt id={`${id}-label`}>{label}</dt>
      <dd aria-labelledby={`${id}-label`} className="truncate" title={text}>
        {text}
      </dd>
    </div>
  );
}

interface FinanceFieldsSectionProps {
  numeroEJ: string;
  index: number;
  financesEJPromise: Promise<FinancesEJResult>;
}

export async function FinanceFieldsSection({
  numeroEJ,
  index,
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
        id={`montant-attribue-initial-ej-${index}`}
        label="Montant attribué initial"
        value={ejResult.data.montant_engage_initial}
        className="order-first"
      />
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
    </>
  );
}
