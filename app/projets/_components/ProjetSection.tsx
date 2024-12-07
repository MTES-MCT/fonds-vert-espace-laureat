import { Projet } from "../../../utils/projets";

const getSubvention = (projet: Projet) => {
  if (projet.montant_subvention_attribuee) {
    return projet.montant_subvention_attribuee;
  }

  if (
    projet.ratio_aide_fonds_vert_sur_total_depenses &&
    projet.total_des_depenses
  ) {
    return (
      projet.ratio_aide_fonds_vert_sur_total_depenses *
      projet.total_des_depenses
    );
  }

  return "montant subvention inconnu";
};

export function ProjetSection({ projet }: { projet: Projet }) {
  return (
    <li className="text-sm bg-gray-100 px-2 py-1 rounded-full">
      <span className="font-semibold">{projet.nom_du_projet}</span>{" "}
      <span>{getSubvention(projet)}</span>
    </li>
  );
}
