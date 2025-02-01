import Link from "next/link";

import { NonDisponible } from "@/components/non-disponible/NonDisponible";
import { ProgressBar } from "@/components/progress-bar/ProgressBar";

export function SubventionDetails({
  montantSubventionAttribuee,
}: {
  montantSubventionAttribuee: number;
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
      <div className="flex items-center gap-x-2 text-gray-900 font-semibold mb-4">
        Consommé : <NonDisponible />
      </div>
      <ProgressBar
        value={montantSubventionAttribuee}
        max={montantSubventionAttribuee}
        formattedMin="0 €"
        formattedMax={formattedMontantSubventionAttribuee}
      />
      <p className="text-sm mb-3">
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
        className="fr-btn fr-btn--tertiary fr-btn--sm bg-white hover:bg-gray-50"
        target="_blank"
        href="https://www.demarches-simplifiees.fr/commencer/813814e9-84dd-43ce-9e38-f64b561abf5f"
      >
        Demander un versement
      </Link>
    </>
  );
}
