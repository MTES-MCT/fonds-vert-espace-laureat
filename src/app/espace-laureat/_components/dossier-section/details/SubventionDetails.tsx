import { InformationFinanciereTimeline } from "@/app/espace-laureat/_components/dossier-section/details/InformationFinanciereTimeline";
import { InformationFinanciere } from "@/services/fondsvert/dossier";
import { formatEuros } from "@/utils/format";

export function SubventionDetails({
  montantSubventionAttribuee,
  informationFinanciere,
}: {
  montantSubventionAttribuee?: number;
  informationFinanciere?: InformationFinanciere;
}) {
  const formattedMontantSubventionAttribuee = formatEuros(
    montantSubventionAttribuee,
  );

  return (
    <div data-testid="subvention-details">
      <p
        className="mb-2 text-xl font-semibold text-gray-800"
        data-testid="subvention-amount"
      >
        {formattedMontantSubventionAttribuee} attribué
      </p>
      <div
        className="mt-4 border-t border-gray-200"
        data-testid="financial-timeline-container"
      >
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
