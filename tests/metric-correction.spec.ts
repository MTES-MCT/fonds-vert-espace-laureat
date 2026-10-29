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

import { getDossierData } from "./fixtures/ds";
import { authenticatePage } from "./setup/auth";
import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const DOSSIER_NUMBER = 89000031;
const PORTEUR_EMAIL = "porteur.metriques@example.com";
const INSTRUCTEUR_EMAIL = "instructeur.metriques@example.com";

async function postCorrection({
  page,
  metricCode,
  value,
  expectedRevision,
  authorEmail,
}: {
  page: Page;
  metricCode: string;
  value: unknown;
  expectedRevision: unknown;
  authorEmail?: string;
}) {
  return page.evaluate(
    async ({
      dossierNumber,
      metricCode,
      value,
      expectedRevision,
      authorEmail,
    }) => {
      const response = await fetch(
        `/api/projets/${dossierNumber}/metrics/${metricCode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, expectedRevision, authorEmail }),
        },
      );

      return { status: response.status, body: await response.json() };
    },
    {
      dossierNumber: DOSSIER_NUMBER,
      metricCode,
      value,
      expectedRevision,
      authorEmail,
    },
  );
}

async function storedRevisions() {
  const sql = createTestDatabaseClient();
  try {
    return await sql<
      {
        revision: number;
        number_value: number;
        author_email: string | null;
        created_at: Date;
      }[]
    >`
      select revision, number_value::float8 as number_value, author_email, created_at
      from dossier_metric_revisions
      where dossier_number = ${DOSSIER_NUMBER} and metric_code = 'metric'
      order by revision
    `;
  } finally {
    await sql.end();
  }
}

test.describe.configure({ mode: "serial" });

test.use({
  mswHandlers: [
    [
      ds.query("getDossierAccess", () => {
        const { demandeur } = getDossierData.data.dossier;
        return HttpResponse.json({
          data: {
            dossier: {
              demandeur,
              usager: { email: PORTEUR_EMAIL },
              groupeInstructeur: {
                instructeurs: [{ email: INSTRUCTEUR_EMAIL }],
              },
            },
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
      metric: { label: "Métrique", unite: "ha", valeur_estimee: 12.5 },
    },
  });
  await authenticatePage(page, { email: PORTEUR_EMAIL });
  await page.goto("/projets/demo");
});

test.afterAll(async () => {
  await deleteStoredDossierMetrics(DOSSIER_NUMBER);
});

for (const { actor, email, status, error } of [
  {
    actor: "an unauthenticated visitor",
    email: null,
    status: 401,
    error: "Utilisateur non authentifié",
  },
  {
    actor: "an unrelated authenticated user",
    email: "mallory@example.com",
    status: 403,
    error: "Accès refusé à ce dossier",
  },
]) {
  test(`refuses ${actor} without exposing or changing a metric`, async ({
    page,
  }) => {
    await page.context().clearCookies();
    if (email) await authenticatePage(page, { email });

    const response = await postCorrection({
      page,
      metricCode: "metric",
      value: 13,
      expectedRevision: 1,
    });

    expect(response).toEqual({ status, body: { error } });
    expect(await storedRevisions()).toEqual([
      {
        revision: 1,
        number_value: 12.5,
        author_email: null,
        created_at: expect.any(Date),
      },
    ]);

    await authenticatePage(page, { email: PORTEUR_EMAIL });
    const authorized = await postCorrection({
      page,
      metricCode: "metric",
      value: 13,
      expectedRevision: 1,
    });
    expect(authorized.status).toBe(200);
    expect((await storedRevisions())[1]).toMatchObject({
      number_value: 13,
      author_email: PORTEUR_EMAIL,
    });
  });
}

test("rejects an unknown metric target", async ({ page }) => {
  const response = await postCorrection({
    page,
    metricCode: "unknown",
    value: 13,
    expectedRevision: 1,
  });

  expect(response).toEqual({
    status: 404,
    body: { error: "Métrique inconnue pour ce dossier" },
  });
  expect(await storedRevisions()).toHaveLength(1);
});

test("rejects an invalid metric type without creating a revision", async ({
  page,
}) => {
  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: "13",
    expectedRevision: 1,
  });

  expect(response).toEqual({
    status: 400,
    body: { error: "Valeur invalide pour le type de la métrique" },
  });
  expect(await storedRevisions()).toHaveLength(1);
});

test("requires the opened revision on every correction request", async ({
  page,
}) => {
  for (const expectedRevision of [undefined, null, "1", 0, 1.5]) {
    const response = await postCorrection({
      page,
      metricCode: "metric",
      value: 13,
      expectedRevision,
    });
    expect(response).toEqual({
      status: 400,
      body: { error: "Révision lue invalide ou manquante" },
    });
  }
  expect(await storedRevisions()).toHaveLength(1);
});

test("attributes successive corrections to the ordinary porteur and instructeur sessions", async ({
  page,
}) => {
  const porteurCorrection = await postCorrection({
    page,
    metricCode: "metric",
    value: 13.75,
    expectedRevision: 1,
    authorEmail: "forged@example.com",
  });
  expect(porteurCorrection.status).toBe(200);
  expect(porteurCorrection.body).toMatchObject({
    target: {
      metricCode: "metric",
      revision: 2,
      sourceValue: 12.5,
      effectiveValue: 13.75,
    },
  });

  await page.context().clearCookies();
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  const instructeurCorrection = await postCorrection({
    page,
    metricCode: "metric",
    value: 15,
    expectedRevision: 2,
    authorEmail: "forged@example.com",
  });
  expect(instructeurCorrection.status).toBe(200);

  expect(await storedRevisions()).toEqual([
    {
      revision: 1,
      number_value: 12.5,
      author_email: null,
      created_at: expect.any(Date),
    },
    {
      revision: 2,
      number_value: 13.75,
      author_email: PORTEUR_EMAIL,
      created_at: expect.any(Date),
    },
    {
      revision: 3,
      number_value: 15,
      author_email: INSTRUCTEUR_EMAIL,
      created_at: expect.any(Date),
    },
  ]);
  await expect(
    getDossierMetricsState({ numeroDossier: DOSSIER_NUMBER }),
  ).resolves.toMatchObject({ metrics: { metric: { valeur_estimee: 15 } } });
});

test("keeps the previous author and date when an authorized actor saves the same value", async ({
  page,
}) => {
  await postCorrection({
    page,
    metricCode: "metric",
    value: 13,
    expectedRevision: 1,
  });
  const before = await storedRevisions();

  await page.context().clearCookies();
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: 13,
    expectedRevision: 2,
  });

  expect(response.status).toBe(200);
  expect(response.body.target.revision).toBe(2);
  expect(await storedRevisions()).toEqual(before);
});

test("returns the current value on conflict without writing or disclosing its author", async ({
  page,
}) => {
  await postCorrection({
    page,
    metricCode: "metric",
    value: 13,
    expectedRevision: 1,
  });
  const before = await storedRevisions();

  await page.context().clearCookies();
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: 14,
    expectedRevision: 1,
  });

  expect(response.status).toBe(409);
  expect(response.body.error).toContain("La valeur actuelle a été chargée");
  expect(response.body.target).toEqual({
    metricCode: "metric",
    revision: 2,
    label: "Métrique",
    unit: "ha",
    valueType: "number",
    sourceValue: 12.5,
    effectiveValue: 13,
  });
  expect(await storedRevisions()).toEqual(before);
});

test("attributes an administrator correction to the administrator session", async ({
  page,
}) => {
  await page.context().clearCookies();
  await authenticatePage(page, { email: "alice.doe@example.com" });

  const response = await postCorrection({
    page,
    metricCode: "metric",
    value: 16,
    expectedRevision: 1,
  });

  expect(response.status).toBe(200);
  expect((await storedRevisions())[1]).toMatchObject({
    revision: 2,
    number_value: 16,
    author_email: "alice.doe@example.com",
  });
});
