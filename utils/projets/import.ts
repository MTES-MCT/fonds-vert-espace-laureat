import { parse } from "fast-csv";
import fs from "fs";
import path from "path";

import { Projet } from "@/utils/projets/projet";

function parseFloatOrNull(value: string): number | null {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

export async function importProjets(): Promise<Projet[]> {
  const filePath = path.join(process.cwd(), "data", "projets.csv");
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "Export projets.csv introuvable dans le dossier utils/projets/data",
    );
  }
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
