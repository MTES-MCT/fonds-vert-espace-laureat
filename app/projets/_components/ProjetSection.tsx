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
      className="flex flex-col gap-y-6 border bg-white shadow-sm text-sm p-6 rounded-lg w-96"
    >
      <div className="text-3xl font-bold text-gray-900">
        <div className="text-xs font-normal text-gray-400">
          Subvention Fonds Vert / total des dépenses
        </div>
        {getSubvention(projet)}{" "}
        <span className="text-lg font-medium">
          / {formattedMontantTotalDepense}{" "}
        </span>
      </div>
      <div className="h-28">
        <p className="line-clamp-5">{projet.nom_du_projet}</p>
      </div>
    </li>
  );
}
