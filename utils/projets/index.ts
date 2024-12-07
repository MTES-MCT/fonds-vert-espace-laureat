import { groupBy, sum, summarize, tidy } from "@tidyjs/tidy";
import { parse } from "fast-csv";
import * as fs from "fs";

export interface Projet {
  demarche_title: string;
  demarche_number: number;
  nom_du_projet: string;
  resume_du_projet: string | null;
  date_depot: string;
  code_region: string;
  nom_region: string;
  code_departement: string;
  nom_departement: string;
  nom_commune: string;
  code_commune: string;
  entreprise_raison_sociale: string;
  total_des_depenses: number;
  ratio_aide_fonds_vert_sur_total_depenses: number | null;
  annee_millesime: number;
  montant_subvention_attribuee: number | null;
  zonages_specifiques: string | null;
  entreprise_forme_juridique: string;
  population_commune: number;
}

function parseFloatOrNull(value: string): number | null {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

async function parseProjets(): Promise<Projet[]> {
  const filePath = process.cwd() + "/utils/projets/fusion.csv";
  const projets: Projet[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("error", (error: Error) => reject(error))
      .on("data", (row) => {
        const projet: Projet = {
          ...row,
          demarche_number: parseInt(row.demarche_number),
          total_des_depenses: parseFloat(row.total_des_depenses),
          ratio_aide_fonds_vert_sur_total_depenses: parseFloatOrNull(
            row.ratio_aide_fonds_vert_sur_total_depenses,
          ),
          annee_millesime: parseInt(row.annee_millesime),
          montant_subvention_attribuee: parseFloatOrNull(
            row.montant_subvention_attribuee,
          ),
          population_commune: parseInt(row.population_commune),
          date_depot: new Date(row.date_depot),
        };
        projets.push(projet);
      })
      .on("end", () => {
        resolve(projets);
      });
  });
}

export const projets = await parseProjets();

export const projetsParRegion = tidy(
  projets,
  groupBy(
    ["code_region", "demarche_number"],
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
