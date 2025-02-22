import Link from "next/link";

import { InformationFinanciereTimeline } from "@/app/espace-laureat/_components/dossier-section/details/InformationFinanciereTimeline";
import { InformationFinanciere } from "@/services/fondsvert/dossier";

export function SubventionDetails({
  montantSubventionAttribuee,
  informationFinanciere,
}: {
  montantSubventionAttribuee?: number;
  informationFinanciere?: InformationFinanciere;
}) {
  const formattedMontantSubventionAttribuee = montantSubventionAttribuee
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(montantSubventionAttribuee)
    : "N/A";

  return (
    <>
      <p className="mb-2 text-2xl font-semibold">
        {formattedMontantSubventionAttribuee}
      </p>
      <p className="text-sm mb-3 max-w-xl text-balance">
        Vous pouvez obtenir une avance au démarrage des travaux à hauteur de 30%
        maximum du montant de la subvention.{" "}
        <a
          className="fr-link fr-link--sm"
          target="_blank"
          href="https://www.ecologie.gouv.fr/fonds-vert"
        >
          En savoir plus
        </a>
      </p>
      <Link
        className="fr-btn fr-btn--tertiary fr-btn--sm bg-white hover:bg-gray-50 mb-4"
        target="_blank"
        href="https://www.demarches-simplifiees.fr/commencer/813814e9-84dd-43ce-9e38-f64b561abf5f"
      >
        Demander un versement
      </Link>
      <div className="mt-4">
        {informationFinanciere &&
        informationFinanciere.informations_engagement?.length > 0 ? (
          <InformationFinanciereTimeline
            informationFinanciere={informationFinanciere}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-48 bg-gray-100 text-gray-500">
            Historique financier non disponible
          </div>
        )}
      </div>
    </>
  );
}
