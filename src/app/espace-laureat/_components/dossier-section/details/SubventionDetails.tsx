import Link from "next/link";

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
    <>
      <div className="pt-4 pb-6 border-b border-t">
        <p className="mb-2 text-xl text-gray-800 font-semibold">
          {formattedMontantSubventionAttribuee} attribué
        </p>
        <p className="text-xs mb-3 max-w-xl text-balance">
          Vous pouvez obtenir une avance au démarrage des travaux à hauteur de
          30% maximum du montant de la subvention.{" "}
          <a
            className="fr-link fr-link--sm text-xs"
            target="_blank"
            href="https://www.ecologie.gouv.fr/fonds-vert"
          >
            En savoir plus
          </a>
        </p>
        <Link
          className="fr-btn fr-btn--secondary fr-btn--sm bg-white hover:bg-gray-50 mb-0"
          target="_blank"
          href="https://www.demarches-simplifiees.fr/commencer/813814e9-84dd-43ce-9e38-f64b561abf5f"
        >
          Demander un versement
        </Link>
      </div>
      <div>
        {informationFinanciere &&
          informationFinanciere.informations_engagement?.length > 0 && (
            <InformationFinanciereTimeline
              informationFinanciere={informationFinanciere}
            />
          )}
      </div>
    </>
  );
}
