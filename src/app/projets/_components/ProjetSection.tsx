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
      className={`
        flex h-72 w-80 flex-col gap-y-5 border-t-4 border-green-400 bg-white p-6 text-sm shadow-xl
      `}
    >
      <div className="text-2xl font-bold text-gray-900">
        <div className="mb-1 border-b border-gray-100 pb-1 text-xs font-normal text-gray-500">
          Subvention Fonds Vert
        </div>
        <div className="flex justify-between">
          <div>{getSubvention(projet)}</div>
          {ratio && <div className="text-gray-400 opacity-80">{ratio}%</div>}
        </div>
      </div>
      <div className="text-base font-medium">
        <div className="mb-1 border-b border-gray-100 pb-1 text-xs font-normal text-gray-500">
          Montant total du projet
        </div>
        {formattedMontantTotalDepense}
      </div>
      <div className="flex h-full flex-col justify-between">
        <p className="mb-0 line-clamp-4 text-sm leading-tight text-gray-600">
          {projet.nom_du_projet}
        </p>
        <p className="mb-0 text-right text-xs text-gray-500">
          {projet.nom_commune}
        </p>
      </div>
    </li>
  );
}
