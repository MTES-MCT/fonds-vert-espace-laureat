import { InformationFinanciereTimeline } from "@/app/espace-laureat/_components/dossier-section/details/InformationFinanciereTimeline";
import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { FinancesEJData } from "@/services/fondsvert/finances";
import { getMontantTotalPaye } from "@/utils/finance";
import { formatEuros } from "@/utils/format";

export function SubventionDetails({
  montantSubventionAttribuee,
  totalDesDepenses,
  informationFinanciere,
  financesEJMap,
}: {
  montantSubventionAttribuee?: number;
  totalDesDepenses?: number;
  informationFinanciere?: InformationFinanciere;
  financesEJMap: Record<string, FinancesEJData>;
}) {
  return (
    <div className="space-y-8">
      <dl>
        <dt id="total-depenses-label">Montant total des dépenses du projet</dt>
        <dd aria-labelledby="total-depenses-label" className="font-semibold">
          {formatEuros(totalDesDepenses)}
        </dd>
      </dl>

      <section aria-labelledby="aide-fonds-vert-heading">
        <h4 id="aide-fonds-vert-heading" className="mb-2 text-lg font-bold">
          Aide du Fonds vert
        </h4>
        <dl className="grid grid-cols-3 border border-gray-200 px-8 py-6">
          <div>
            <dt id="subvention-attribuee-label">Montant attribué</dt>
            <dd
              aria-labelledby="subvention-attribuee-label"
              className="font-semibold"
            >
              {formatEuros(montantSubventionAttribuee)}
            </dd>
          </div>
          <div>
            <dt id="montant-paye-label">Montant total payé</dt>
            <dd aria-labelledby="montant-paye-label" className="font-semibold">
              {formatEuros(getMontantTotalPaye(informationFinanciere))}
            </dd>
          </div>
        </dl>
      </section>

      {informationFinanciere &&
        informationFinanciere.informations_engagement?.length > 0 && (
          <InformationFinanciereTimeline
            informationFinanciere={informationFinanciere}
            financesEJMap={financesEJMap}
          />
        )}
    </div>
  );
}
