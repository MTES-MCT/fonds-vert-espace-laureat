import { ReactNode } from "react";

import { FactList } from "@/components/fact-list/FactList";
import { MoneyField } from "@/components/money-field/MoneyField";
import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { getMontantTotalPaye } from "@/utils/finance";
import { formatEuros } from "@/utils/format";

export function SubventionDetails({
  montantSubventionAttribuee,
  totalDesDepenses,
  informationFinanciere,
  engagementsSection,
}: {
  montantSubventionAttribuee?: number;
  totalDesDepenses?: number;
  informationFinanciere?: InformationFinanciere;
  engagementsSection?: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <dl>
        <dt
          id="montant-total-des-depenses-du-projet-label"
          className="text-sm text-[var(--text-mention-grey)]"
        >
          Montant total des dépenses du projet
        </dt>
        <dd
          aria-labelledby="montant-total-des-depenses-du-projet-label"
          className="mb-0 text-3xl font-bold"
        >
          {formatEuros(totalDesDepenses)}
        </dd>
      </dl>

      <section aria-labelledby="aide-fonds-vert-heading">
        <h3 id="aide-fonds-vert-heading" className="fr-h6 mb-3">
          Aide du Fonds vert
        </h3>
        <FactList>
          <MoneyField
            label="Montant attribué"
            value={montantSubventionAttribuee}
          />
          <MoneyField
            label="Montant total payé"
            value={
              informationFinanciere
                ? getMontantTotalPaye(informationFinanciere)
                : undefined
            }
          />
        </FactList>
      </section>

      {engagementsSection}
    </div>
  );
}
