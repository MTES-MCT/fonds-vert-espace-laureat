import { groupBy, sum, summarize, tidy } from "@tidyjs/tidy";

import { importProjets } from "@/utils/projets/import";

import { Projet } from "./projet";

interface ProjetsParDemarche {
  total_des_depenses: number;
  demarche_title: string;
  projets: Projet[];
}

type ProjetsParDepartementDemarche = Record<
  string,
  Record<number, ProjetsParDemarche>
>;

const projets = (await importProjets()).sort(
  (projet1, projet2) => projet2.total_des_depenses - projet1.total_des_depenses,
);

export const projetsParDepartementDemarche: ProjetsParDepartementDemarche =
  tidy(
    projets,
    groupBy(
      ["code_departement", "demarche_number"],
      [
        summarize({
          total_des_depenses: sum("total_des_depenses"),
          demarche_title: (group) => group[0].demarche_title,
          projets: (group) => group,
        }),
      ],
      groupBy.object({ single: true }),
    ),
  );
