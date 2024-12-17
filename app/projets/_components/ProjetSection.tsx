import { Projet } from "@/utils/projets/projet";

const currencyOptions: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

const getSubvention = (projet: Projet) => {
  if (projet.montant_subvention_attribuee) {
    return new Intl.NumberFormat("fr-FR", currencyOptions).format(
      projet.montant_subvention_attribuee,
    );
  }
  return "Inconnu";
};

export function ProjetSection({
  key,
  projet,
}: {
  key: string;
  projet: Projet;
}) {
  const formattedMontantTotalDepense = new Intl.NumberFormat(
    "fr-FR",
    currencyOptions,
  ).format(projet.total_des_depenses);

  return (
    <li
      key={key}
      className="shadow-xl border-t-4 border-green-400 flex flex-col gap-y-6 bg-white text-sm p-6 h-60 w-80"
    >
      <div className="text-3xl font-bold text-gray-900">
        <div className="text-xs font-normal text-gray-400">
          Subvention Fonds Vert / total des dépenses
        </div>
        {getSubvention(projet)}{" "}
        <span className="text-base font-medium">
          / {formattedMontantTotalDepense}{" "}
        </span>
      </div>
      <div className="h-full flex flex-col justify-between">
        <p className="mb-0 line-clamp-4 text-sm text-gray-600">
          {projet.nom_du_projet}
        </p>
        <p className="mb-0 text-right text-xs text-gray-400">
          {projet.nom_commune_sinon_departement}
        </p>
      </div>
    </li>
  );
}
