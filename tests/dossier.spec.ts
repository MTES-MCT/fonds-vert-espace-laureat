import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { testDossier } from "./fixtures/ds";
import { testDossierFondsVert } from "./fixtures/fondsvert";
import { champsDS } from "./fixtures/grist";
import { authenticatePage } from "./setup/auth";

const ds = graphql.link("https://www.demarches-simplifiees.fr/api/v2/graphql");

test.beforeEach(async ({ page }) => {
  await authenticatePage(page);
});

test.use({
  mswHandlers: [
    [
      http.post("http://fondsvert/fonds_vert/login", () => {
        return HttpResponse.json({
          access_token: "abc",
          token_type: "bearer",
        });
      }),

      ds.query("getDossier", () => {
        return HttpResponse.json({ data: { dossier: testDossier } });
      }),

      ds.query("getDemarcheDossiers", () => {
        return HttpResponse.json({
          data: {
            demarche: {
              dossiers: {
                nodes: [],
              },
            },
          },
        });
      }),

      http.get("http://fondsvert/fonds_vert/v2/dossiers/12345679", () => {
        return HttpResponse.json({ data: testDossierFondsVert });
      }),

      http.get("http://grist/docs/id/tables/Champs_DS/records", () => {
        return HttpResponse.json(champsDS);
      }),
    ],
    { scope: "test" },
  ],
});

test("dossier page displays correctly", async ({ page, msw }) => {
  await page.goto("/espace-laureat/12345679");

  await expect(page).toHaveTitle("");
});
