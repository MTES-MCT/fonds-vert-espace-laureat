import { Suspense } from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import { groupEngagementsByEJ } from "@/utils/finance";

import { FinanceFieldsErrorAlert } from "./engagement-juridique/FinanceFieldsErrorAlert";
import {
  type FinanceFieldsPart,
  FinanceFieldsSection,
} from "./engagement-juridique/FinanceFieldsSection";
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

  const financeFieldsSlots = engagementsList.map((group) => {
    const slot = (part: FinanceFieldsPart) => (
      <Suspense fallback={<FinanceFieldsSkeleton part={part} />}>
        <FinanceFieldsSection
          part={part}
          numeroEJ={group.numero_ej}
          financesEJPromise={financesEJPromise}
        />
      </Suspense>
    );
    return { initialAmount: slot("initialAmount"), parties: slot("parties") };
  });

  return (
    <>
      <Suspense fallback={null}>
        <FinanceFieldsErrorAlert financesEJPromise={financesEJPromise} />
      </Suspense>
      <EngagementsJuridiquesList
        engagementsList={engagementsList}
        financeFieldsSlots={financeFieldsSlots}
      />
    </>
  );
}
