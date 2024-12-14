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
  return "montant subvention inconnu";
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
    <li key={key} className="border shadow-sm text-sm p-6 rounded-lg w-96">
      <div className="text-xs text-gray-400 mb-1">
        Subvention Fonds Vert / total des dépenses
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {getSubvention(projet)}{" "}
        <span className="text-lg font-medium">
          / {formattedMontantTotalDepense}{" "}
        </span>
      </div>
      <div className="h-28 mt-3">
        <p className="line-clamp-5">{projet.nom_du_projet}</p>
      </div>
    </li>
  );
}
