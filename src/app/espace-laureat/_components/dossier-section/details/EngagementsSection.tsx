import { Suspense } from "react";

import { FinancesEJResult } from "@/app/espace-laureat/[dossierNumber]/page";
import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { groupEngagementsByEJ } from "@/utils/finance";

import { FinanceFieldsErrorAlert } from "./engagement-juridique/FinanceFieldsErrorAlert";
import { FinanceFieldsSection } from "./engagement-juridique/FinanceFieldsSection";
import { EngagementsJuridiquesList } from "./EngagementsJuridiquesList";
import { FinanceFieldsSkeleton } from "./EngagementsSkeleton";

interface EngagementsSectionProps {
  informationFinanciere: InformationFinanciere;
  financesEJPromise: Promise<FinancesEJResult>;
}

export function EngagementsSection({
  informationFinanciere,
  financesEJPromise,
}: EngagementsSectionProps) {
  const engagementsList = groupEngagementsByEJ(informationFinanciere);

  const financeFieldsSlots = engagementsList.map((group) => (
    <Suspense key={group.numero_ej} fallback={<FinanceFieldsSkeleton />}>
      <FinanceFieldsSection
        numeroEJ={group.numero_ej}
        financesEJPromise={financesEJPromise}
      />
    </Suspense>
  ));

  return (
    <>
      <Suspense fallback={null}>
        <FinanceFieldsErrorAlert financesEJPromise={financesEJPromise} />
      </Suspense>
      <EngagementsJuridiquesList
        informationFinanciere={informationFinanciere}
        financeFieldsSlots={financeFieldsSlots}
      />
    </>
  );
}
