import { FactRow } from "@/components/fact-list/FactList";
import { MoneyField } from "@/components/money-field/MoneyField";
import { FinancesEJResult } from "@/services/fondsvert/finances";
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

  return (
    <FactRow
      id={`${slugify(singular)}-${scope}-label`}
      label={values.length > 1 ? plural : singular}
    >
      {values.join(", ")}
    </FactRow>
  );
}

export type FinanceFieldsPart = "initialAmount" | "parties";

interface FinanceFieldsSectionProps {
  part: FinanceFieldsPart;
  numeroEJ: string;
  financesEJPromise: Promise<FinancesEJResult>;
}

export async function FinanceFieldsSection({
  part,
  numeroEJ,
  financesEJPromise,
}: FinanceFieldsSectionProps) {
  const results = await financesEJPromise;
  const ejResult = results[numeroEJ];

  if (!ejResult?.success) {
    return null;
  }

  if (part === "initialAmount") {
    return (
      <MoneyField
        label="Montant attribué initial"
        value={ejResult.data.montant_engage_initial}
        scope={numeroEJ}
      />
    );
  }

  const fournisseurs = getLatestYearPostesField(
    ejResult.data,
    "fournisseur_titulaire_nom",
  );
  const centresCouts = getLatestYearPostesField(ejResult.data, "centre_couts");

  return (
    <>
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
