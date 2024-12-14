import { groupBy, sum, summarize, tidy } from "@tidyjs/tidy";

import { importProjets } from "@/utils/projets/import";

import { Projet } from "./projet";

export interface Projets {
  total_des_depenses: number;
  demarche_title: string;
  nom_commune_sinon_departement: string;
  code_commune_sinon_departement: string;
  projets: Projet[];
}

export type ProjetsParDemarches = Array<Projets>;

export type ProjetsParAnneeDemarches = Record<string, ProjetsParDemarches>;

export type ProjetsParCommunesAnneeDemarches = Record<
  string,
  ProjetsParAnneeDemarches
>;

const projetsTries = (await importProjets()).sort(
  (projet1, projet2) => projet2.total_des_depenses - projet1.total_des_depenses,
);

export const communeEtDepartements = projetsTries.reduce(
  (acc, projet) => {
    if (projet.code_commune_sinon_departement) {
      acc[projet.code_commune_sinon_departement] =
        projet.nom_commune_sinon_departement;
    }
    return acc;
  },
  {} as Record<string, string>,
);

export const projetsGroupes: ProjetsParCommunesAnneeDemarches = tidy(
  projetsTries,
  groupBy(
    ["code_commune_sinon_departement", "annee_millesime", "demarche_number"],
    [
      summarize<Projet>({
        total_des_depenses: sum("total_des_depenses"),
        demarche_title: (group) => group[0].demarche_title,
        nom_commune_sinon_departement: (group) =>
          group[0].nom_commune_sinon_departement,
        code_commune_sinon_departement: (group) =>
          group[0].code_commune_sinon_departement,
        projets: (group) => group,
      }),
    ],
    groupBy.levels({
      levels: ["object", "object", "values"],
      single: true,
    }),
  ),
);
