import {
  expect,
  graphql,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  getDossierMetricsState,
  importDossierMetricsIfMissing,
} from "@/db/dossierMetrics";

import { DOSSIER_NUMBER } from "./fixtures/constants";
import { getDossierData } from "./fixtures/ds";
import { authenticatePage } from "./setup/auth";
import { deleteStoredDossierMetrics } from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");

async function postCorrection({
  page,
  metricCode,
  value,
}: {
  page: Page;
  metricCode: string;
  value: unknown;
}) {
  await page.goto("/projets/demo");

  return page.evaluate(
    async ({ dossierNumber, metricCode, value }) => {
      const response = await fetch(
        `/api/projets/${dossierNumber}/metrics/${metricCode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        },
      );

      return {
        status: response.status,
        body: await response.json(),
      };
    },
    { dossierNumber: DOSSIER_NUMBER, metricCode, value },
  );
}

test.describe.configure({ mode: "serial" });

test.use({
  mswHandlers: [
    [
      ds.query("getDossierAccess", () => {
        const { demandeur, groupeInstructeur, usager } =
          getDossierData.data.dossier;
        return HttpResponse.json({
          data: {
            dossier: { demandeur, groupeInstructeur, usager },
          },
        });
      }),
    ],
    { scope: "test" },
  ],
});

test.beforeEach(async ({ page }) => {
  await deleteStoredDossierMetrics(DOSSIER_NUMBER);
  await importDossierMetricsIfMissing({
    numeroDossier: DOSSIER_NUMBER,
    metrics: {
      metric: {
        label: "Métrique",
        unite: "ha",
        valeur_estimee: 12.5,
      },
    },
  });
  await authenticatePage(page);
});

test.afterAll(async () => {
  await deleteStoredDossierMetrics(DOSSIER_NUMBER);
});

test("rejects a correction when the user cannot access the dossier", async ({
  page,
}) => {
  await page.context().clearCookies();
  await authenticatePage(page, { email: "mallory@example.com" });

  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: 13,
  });

  expect(response.status).toBe(403);
  await expect(
    getDossierMetricsState({ numeroDossier: DOSSIER_NUMBER }),
  ).resolves.toMatchObject({
    metrics: {
      metric: {
        valeur_estimee: 12.5,
      },
    },
  });
});

test("rejects an unknown metric target", async ({ page }) => {
  const response = await postCorrection({
    page,
    metricCode: "unknown",
    value: 13,
  });

  expect(response.status).toBe(404);
  expect(response.body).toEqual({
    error: "Métrique inconnue pour ce dossier",
  });
});

test("rejects a value with a different stored type", async ({ page }) => {
  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: "13",
  });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    error: "Valeur invalide pour le type de la métrique",
  });
});

test("creates one local revision and returns its effective value", async ({
  page,
}) => {
  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: 13.75,
  });

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    target: {
      metricCode: "metric",
      revision: 2,
      sourceValue: 12.5,
      effectiveValue: 13.75,
    },
  });
  await expect(
    getDossierMetricsState({ numeroDossier: DOSSIER_NUMBER }),
  ).resolves.toMatchObject({
    metrics: {
      metric: {
        valeur_estimee: 13.75,
      },
    },
  });
});
