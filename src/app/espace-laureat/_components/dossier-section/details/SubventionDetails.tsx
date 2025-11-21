import { InformationFinanciereTimeline } from "@/app/espace-laureat/_components/dossier-section/details/InformationFinanciereTimeline";
import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { getMontantTotalPaye } from "@/utils/finance";
import { formatEuros } from "@/utils/format";

export function SubventionDetails({
  montantSubventionAttribuee,
  totalDesDepenses,
  informationFinanciere,
}: {
  montantSubventionAttribuee?: number;
  totalDesDepenses?: number;
  informationFinanciere?: InformationFinanciere;
}) {
  return (
    <div>
      <dl className="mb-4">
        <dt id="total-depenses-label">Montant total des dépenses du projet</dt>
        <dd aria-labelledby="total-depenses-label" className="font-semibold">
          {formatEuros(totalDesDepenses)}
        </dd>
      </dl>

      <section
        aria-labelledby="aide-fonds-vert-heading"
        className="border-y border-gray-200 py-5"
      >
        <h4 id="aide-fonds-vert-heading" className="mb-3 text-lg font-bold">
          Aide du Fonds vert
        </h4>
        <dl className="grid grid-cols-3">
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

      <div data-testid="financial-timeline-container">
        {informationFinanciere &&
          informationFinanciere.informations_engagement?.length > 0 && (
            <InformationFinanciereTimeline
              informationFinanciere={informationFinanciere}
            />
          )}
      </div>
    </div>
  );
}
