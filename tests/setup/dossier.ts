import {
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { makeDossierDataWithNumber } from "../fixtures/ds";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ1Data,
  fondsVertFinancesEJ2Data,
  fondsVertLoginData,
} from "../fixtures/fondsvert";
import { authenticatePage } from "./auth";
import { deleteStoredDossierMetrics } from "./db";

export function configureAdministratorDossierFixtures(dossierNumber: number) {
  const dossierData = makeDossierDataWithNumber(dossierNumber);
  const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
  // Les scénarios d’une suite partagent son dossier de préparation.
  test.describe.configure({ mode: "default" });
  test.beforeEach(async ({ page }) => {
    await deleteStoredDossierMetrics(dossierNumber);
    await authenticatePage(page);
  });

  test.use({
    mswHandlers: [
      [
        ds.query("getDossier", () => {
          return HttpResponse.json(dossierData);
        }),

        ds.query("getDossierAccess", () => {
          const { demandeur, groupeInstructeur, usager } =
            dossierData.data.dossier;
          return HttpResponse.json({
            data: {
              dossier: {
                demandeur: { __typename: demandeur.__typename },
                groupeInstructeur,
                usager,
              },
            },
          });
        }),

        http.post("http://fondsvert/fonds_vert/login", () => {
          return HttpResponse.json(fondsVertLoginData);
        }),

        http.get(
          `http://fondsvert/fonds_vert/v2/dossiers/${dossierNumber}`,
          () => {
            return HttpResponse.json(fondsVertDossierData);
          },
        ),

        http.get("http://fondsvert/fonds_vert/v2/finances/2105212345", () => {
          return HttpResponse.json(fondsVertFinancesEJ1Data);
        }),

        http.get("http://fondsvert/fonds_vert/v2/finances/2106789012", () => {
          return HttpResponse.json(fondsVertFinancesEJ2Data);
        }),
      ],
      { scope: "test" },
    ],
  });
  return dossierData;
}
