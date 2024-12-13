import { Projet } from "@/utils/projets/projet";

const getSubvention = (projet: Projet) => {
  return projet.montant_subvention_attribuee ?? "montant subvention inconnu";
};

export function ProjetSection({ projet }: { projet: Projet }) {
  return (
    <li className="text-sm bg-gray-100 px-2 py-1 rounded-full">
      <span className="font-semibold">{projet.nom_du_projet}</span>{" "}
      <span>{getSubvention(projet)}</span>
    </li>
  );
}
