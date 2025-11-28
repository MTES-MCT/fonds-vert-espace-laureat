import Alert from "@codegouvfr/react-dsfr/Alert";

import { FinancesEJResult } from "@/app/espace-laureat/[dossierNumber]/page";

interface FinanceFieldsErrorAlertProps {
  financesEJPromise: Promise<FinancesEJResult>;
}

export async function FinanceFieldsErrorAlert({
  financesEJPromise,
}: FinanceFieldsErrorAlertProps) {
  let hasError = false;

  try {
    const results = await financesEJPromise;
    hasError = Object.values(results).some((result) => !result.success);
  } catch {
    hasError = true;
  }

  if (!hasError) return null;

  return (
    <Alert
      severity="warning"
      small
      className="mb-4"
      description="Les détails des engagements juridiques (fournisseur, centre de coût) sont temporairement indisponibles."
    />
  );
}
