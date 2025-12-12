import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { DOSSIER_NUMBER } from "./fixtures/constants";
import { getDossierData } from "./fixtures/ds";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ1Data,
  fondsVertFinancesEJ2Data,
  fondsVertLoginData,
} from "./fixtures/fondsvert";
import { gristChampsDS } from "./fixtures/grist";
import { authenticatePage } from "./setup/auth";

const ds = graphql.link("https://www.demarches-simplifiees.fr/api/v2/graphql");

test.beforeEach(async ({ page }) => {
  await authenticatePage(page);
});

test.use({
  mswHandlers: [
    [
      ds.query("getDossier", () => {
        return HttpResponse.json(getDossierData);
      }),

      http.post("http://fondsvert/fonds_vert/login", () => {
        return HttpResponse.json(fondsVertLoginData);
      }),

      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () => {
          return HttpResponse.json(fondsVertDossierData);
        },
      ),

      http.get("http://grist/docs/id/tables/Champs_DS/records", () => {
        return HttpResponse.json(gristChampsDS);
      }),

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

test("impact prefill link includes dossier number from DS", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const evaluationLink = page.getByTestId("impact-evaluation-link");

  const href = await evaluationLink.getAttribute("href");
  const url = new URL(href!);

  const dossierNumberFromDS = getDossierData.data.dossier.number;
  expect(url.searchParams.get("champ_Q2hhbXAtNDc2OTEyOQ")).toBe(
    String(dossierNumberFromDS),
  );
});

test("impact prefill link is generated correctly with metrics", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const evaluationLink = page.getByTestId("impact-evaluation-link");

  const href = await evaluationLink.getAttribute("href");
  const url = new URL(href!);

  expect(url.searchParams.get("champ_Q2hhbXAtNDgwMTY1OA")).toBe("2055650");
  // Utilise valeur_suivi (1935960) au lieu de valeur_estimee (1235863)
  expect(url.searchParams.get("champ_Q2hhbXAtNDgwMTY1OQ")).toBe("1935960");
  expect(url.searchParams.get("champ_Q2hhbXAtNTA4NTE4Nw")).toBe("448");
  // Utilise valeur_suivi (383) au lieu de valeur_estimee (312)
  expect(url.searchParams.get("champ_Q2hhbXAtNTA4NTE4OA")).toBe("383");

  // Champs qui ne doivent pas être dans l'URL car "à récupérer en sortie":
  expect(url.searchParams.has("champ_Q2hhbXAtNTQ1OTM1Nw")).toBe(false);
});

test("impact prefill link handles multi-value fields correctly", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const evaluationLink = page.getByTestId("impact-evaluation-link");

  const href = await evaluationLink.getAttribute("href");
  const url = new URL(href!);

  // Vérifie que le champ multi-valeur type_batiments utilise la syntaxe avec []
  const typeBatimentsValues = url.searchParams.getAll(
    "champ_Q2hhbXAtNTQ1OTE2Nw[]",
  );
  expect(typeBatimentsValues).toEqual([
    "École (établissement public du premier degré)",
    "Établissement public du second degré",
  ]);
});

test("page loads in degraded mode when Grist is unavailable", async ({
  page,
  msw,
}) => {
  await msw.use(
    http.get("http://grist/docs/id/tables/Champs_DS/records", () => {
      return new HttpResponse(null, { status: 503 });
    }),
  );

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}?nocache=1`);

  const evaluationLink = page.getByTestId("impact-evaluation-link");
  await expect(evaluationLink).toBeVisible();

  const href = await evaluationLink.getAttribute("href");
  const url = new URL(href!);

  expect(url.searchParams.toString()).toBe("");
});
