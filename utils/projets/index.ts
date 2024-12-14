import { groupBy, sum, summarize, tidy } from "@tidyjs/tidy";

import { importProjets } from "@/utils/projets/import";

import { Projet } from "./projet";

export interface Projets {
  total_des_depenses: number;
  demarche_title: string;
  nom_commune: string;
  code_commune: string;
  projets: Projet[];
}

export type ProjetsParDemarches = Array<Projets>;

export type ProjetsParCommunesDemarches = Array<ProjetsParDemarches>;

export type ProjetsParDepartementsDemarchesCommunes = Record<
  string,
  ProjetsParCommunesDemarches
>;

export type ProjetsParAnneesDepartementsDemarchesCommunes = Record<
  string,
  ProjetsParDepartementsDemarchesCommunes
>;

const projetsTries = (await importProjets()).sort(
  (projet1, projet2) => projet2.total_des_depenses - projet1.total_des_depenses,
);

export const projetsGroupes: ProjetsParAnneesDepartementsDemarchesCommunes =
  tidy(
    projetsTries,
    groupBy(
      [
        "annee_millesime",
        "code_departement",
        "code_commune",
        "demarche_number",
      ],
      [
        summarize<Projet>({
          total_des_depenses: sum("total_des_depenses"),
          demarche_title: (group) => group[0].demarche_title,
          nom_commune: (group) => group[0].nom_commune,
          code_commune: (group) => group[0].code_commune,
          projets: (group) => group,
        }),
      ],
      groupBy.levels({
        levels: ["object", "object", "values", "values"],
        single: true,
      }),
    ),
  );
