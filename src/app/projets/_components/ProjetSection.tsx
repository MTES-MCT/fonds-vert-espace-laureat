import { formatEuros } from "@/utils/format";
import { Projet } from "@/utils/projets/projet";

const getSubvention = (projet: Projet) => {
  if (projet.montant_subvention_attribuee) {
    return formatEuros(projet.montant_subvention_attribuee, {
      showDigits: false,
    });
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
  const formattedMontantTotalDepense = formatEuros(projet.total_des_depenses, {
    showDigits: false,
  });

  const ratio =
    projet.montant_subvention_attribuee &&
    Math.ceil(
      (100 * projet.montant_subvention_attribuee) / projet.total_des_depenses,
    );

  return (
    <li
      key={key}
      className="shadow-xl border-t-4 border-green-400 flex flex-col gap-y-5 bg-white text-sm p-6 h-72 w-80"
    >
      <div className="text-2xl font-bold text-gray-900">
        <div className="text-xs font-normal text-gray-500 pb-1 mb-1 border-b border-gray-100">
          Subvention Fonds Vert
        </div>
        <div className="flex justify-between">
          <div>{getSubvention(projet)}</div>
          {ratio && <div className="text-gray-400 opacity-80">{ratio}%</div>}
        </div>
      </div>
      <div className="text-base font-medium">
        <div className="text-xs font-normal text-gray-500 pb-1 mb-1 border-b border-gray-100">
          Montant total du projet
        </div>
        {formattedMontantTotalDepense}
      </div>
      <div className="h-full flex flex-col justify-between">
        <p className="mb-0 line-clamp-4 text-sm text-gray-600 leading-tight">
          {projet.nom_du_projet}
        </p>
        <p className="mb-0 text-right text-xs text-gray-500">
          {projet.nom_commune}
        </p>
      </div>
    </li>
  );
}
