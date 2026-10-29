import { ReactNode } from "react";

import { MoneyField } from "@/components/money-field/MoneyField";
import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { getMontantTotalPaye } from "@/utils/finance";

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
        <MoneyField
          label="Montant total des dépenses du projet"
          value={totalDesDepenses}
          bold
        />
      </dl>

      <section aria-labelledby="aide-fonds-vert-heading">
        <h3 id="aide-fonds-vert-heading" className="mb-2 text-lg font-bold">
          Aide du Fonds vert
        </h3>
        <dl className="grid gap-4 border border-gray-200 p-6 sm:grid-cols-2">
          <MoneyField
            label="Montant attribué"
            value={montantSubventionAttribuee}
            bold
          />
          <MoneyField
            label="Montant total payé"
            value={
              informationFinanciere
                ? getMontantTotalPaye(informationFinanciere)
                : undefined
            }
            bold
          />
        </dl>
      </section>

      {engagementsSection}
    </div>
  );
}
