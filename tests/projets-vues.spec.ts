import {
  expect,
  graphql,
  http,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import { getSessionOptions } from "@/utils/session";

import { makeDossierDataWithNumber } from "./fixtures/ds";
import { fondsVertDossierData, fondsVertLoginData } from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const PORTEUR = "porteur.vue@example.com";
const INSTRUCTEUR = "instructeur.vue@example.com";
const ADMIN = "alice.doe@example.com";
const METRIC_CODE = "surface_batiment_m2_avant_projet";
const METRIC_LABEL = "Surface du bâtiment avant projet";

async function resetProject(dossierNumber: number) {
  await deleteStoredDossierMetrics(dossierNumber);
  const sql = createTestDatabaseClient();
  try {
    await sql`delete from dossier_progress_revisions where dossier_number=${dossierNumber}`;
  } finally {
    await sql.end();
  }
}

async function changeAdminView(page: Page, view: "porteur" | "instructeur") {
  const select = page
    .locator("#fr-header-quick-access-item-0")
    .getByRole("combobox", { name: "Vue super admin" });
  const changed = page.waitForResponse((response) =>
    response.url().endsWith("/api/session/project-view"),
  );
  await select.selectOption(view);
  expect((await changed).status()).toBe(200);
  await expect(select).toHaveValue(view);
  await expect(
    page.getByText(
      view === "porteur" ? "Suivi de votre projet" : "Projet suivi",
      { exact: true },
    ),
  ).toBeVisible();
}

test.beforeEach(async ({ page, msw }, testInfo) => {
  const dossierNumber = 89330000 + testInfo.parallelIndex;
  await resetProject(dossierNumber);
  const dossier = {
    ...makeDossierDataWithNumber(dossierNumber).data.dossier,
    usager: { email: PORTEUR },
    groupeInstructeur: { instructeurs: [{ email: INSTRUCTEUR }] },
  };
  msw.use(
    ds.query("getDossier", () => HttpResponse.json({ data: { dossier } })),
    ds.query("getDossierAccess", () =>
      HttpResponse.json({ data: { dossier } }),
    ),
    http.post("http://fondsvert/fonds_vert/login", () =>
      HttpResponse.json(fondsVertLoginData),
    ),
    http.get("http://fondsvert/fonds_vert/v2/dossiers", () =>
      HttpResponse.json({
        count: 1,
        next_page: null,
        previous_page: null,
        data: [{ socle_commun: { dossier_number: dossierNumber } }],
      }),
    ),
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${dossierNumber}`, () =>
      HttpResponse.json({
        data: {
          ...fondsVertDossierData.data,
          information_financiere: { informations_engagement: [] },
          metrique_specifique: {
            [METRIC_CODE]: {
              label: METRIC_LABEL,
              unite: "m²",
              valeur_estimee: 10,
            },
          },
        },
      }),
    ),
  );
  await authenticatePage(page, { email: PORTEUR });
});

test.afterEach(async ({}, testInfo) => {
  await resetProject(89330000 + testInfo.parallelIndex);
});

for (const [email, listTitle, projectContext] of [
  [PORTEUR, "Mes projets", "Suivi de votre projet"],
  [INSTRUCTEUR, "Projets suivis", "Projet suivi"],
] as const) {
  test(`la personne ${email} entre depuis ses projets avec sa vue DN et ne peut pas basculer`, async ({
    page,
  }, testInfo) => {
    const dossierNumber = 89330000 + testInfo.parallelIndex;
    await page.context().clearCookies();
    await authenticatePage(page, {
      email,
      projectView: email === PORTEUR ? "instructeur" : "porteur",
    });
    await page.goto("/projets?view=instructeur");
    await expect(
      page.getByRole("heading", { level: 1, name: listTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Vue super admin" }),
    ).toHaveCount(0);

    await page
      .getByRole("row")
      .filter({ hasText: String(dossierNumber) })
      .getByRole("link", { name: "Ouvrir" })
      .click();
    await expect(page.getByText(projectContext, { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Pages du projet" })
        .getByRole("link"),
    ).toHaveText(["Synthèse du projet", "Données d’impact", "Financement"]);
    const refused = await page.evaluate(async () => {
      const response = await fetch("/api/session/project-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ view: "instructeur" }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(refused).toEqual({
      status: 403,
      body: { error: "Cette vue est réservée au super admin." },
    });
    await page.reload();
    await expect(page.getByText(projectContext, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Vue super admin" }),
    ).toHaveCount(0);
  });
}

test("le super admin découvre tous les projets puis modifie dans les deux vues avec son email", async ({
  page,
  msw,
}, testInfo) => {
  const dossierNumber = 89330000 + testInfo.parallelIndex;
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/dossiers", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.has("siret")).toBe(false);
      expect(url.searchParams.has("instructeur__instructeur_email")).toBe(
        false,
      );
      return HttpResponse.json({
        count: 1,
        next_page: null,
        previous_page: null,
        data: [{ socle_commun: { dossier_number: dossierNumber } }],
      });
    }),
  );
  await page.context().clearCookies();
  await authenticatePage(page, { email: ADMIN });
  await page.goto("/projets");
  await page
    .getByRole("row")
    .filter({ hasText: String(dossierNumber) })
    .getByRole("link", { name: "Ouvrir" })
    .click();

  for (const [view, value, progress] of [
    ["instructeur", "12", "Bloqué"],
    ["porteur", "15", "En cours de réalisation"],
  ] as const) {
    const path = new URL(page.url()).pathname;
    await changeAdminView(page, view);
    expect(new URL(page.url()).pathname).toBe(path);
    await expect(
      page
        .locator("header")
        .filter({ has: page.getByText(ADMIN, { exact: true }) })
        .first(),
    ).toContainText(ADMIN);
    await page.waitForSelector('[data-fr-js-modal-button="true"]', {
      state: "attached",
    });
    await page
      .getByTestId("impact-section")
      .getByRole("button", { name: "Modifier", exact: true })
      .click();
    const metricDialog = page.getByRole("dialog", {
      name: "Modifier la valeur",
    });
    await metricDialog.getByLabel(METRIC_LABEL).fill(value);
    await metricDialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(metricDialog).toBeHidden();

    await page
      .getByRole("button", { name: "Modifier l’avancement", exact: true })
      .click();
    const progressDialog = page.getByRole("dialog", {
      name: "Modifier l’avancement",
      exact: true,
    });
    await progressDialog
      .getByRole("combobox", { name: "Avancement du projet" })
      .selectOption(progress);
    await progressDialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(progressDialog).toBeHidden();
    await page.reload();
    await expect(
      page
        .getByRole("region", { name: "Avancement du projet" })
        .locator(".fr-badge"),
    ).toHaveText(progress);
  }

  const sql = createTestDatabaseClient();
  try {
    const metricRows =
      await sql`select number_value,author_email from dossier_metric_revisions where dossier_number=${dossierNumber} and metric_code=${METRIC_CODE} and revision>1 order by revision`;
    expect(
      metricRows.map((row) => ({
        value: Number(row.number_value),
        email: row.author_email,
      })),
    ).toEqual([
      { value: 12, email: ADMIN },
      { value: 15, email: ADMIN },
    ]);
    const progressRows =
      await sql`select status,author_email from dossier_progress_revisions where dossier_number=${dossierNumber} order by revision`;
    expect(
      progressRows.map((row) => ({
        status: row.status,
        email: row.author_email,
      })),
    ).toEqual([
      { status: "Bloqué", email: ADMIN },
      { status: "En cours de réalisation", email: ADMIN },
    ]);
  } finally {
    await sql.end();
  }
  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === getSessionOptions().cookieName,
  );
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
});

test("la liste vide garde un vocabulaire neutre sans inventer de profil", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/dossiers", () =>
      HttpResponse.json({
        count: 0,
        next_page: null,
        previous_page: null,
        data: [],
      }),
    ),
  );
  await page.goto("/projets");
  await expect(
    page.getByRole("heading", { level: 1, name: "Projets", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Aucun projet accessible", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Vue super admin" }),
  ).toHaveCount(0);
});

test("une fiche DN indisponible ne détermine pas la vue de la liste", async ({
  page,
  msw,
}) => {
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json(
        { errors: [{ message: "DN unavailable" }] },
        { status: 503 },
      ),
    ),
  );
  await page.goto("/projets");
  await expect(
    page.getByRole("heading", { level: 1, name: "Projets", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("La liste des projets est incomplète", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Aucun projet accessible", { exact: false }),
  ).toHaveCount(0);
});

test("la préférence de vue exige une session admin et une valeur reconnue", async ({
  page,
}) => {
  await page.goto("/projets");
  await page.context().clearCookies();
  const unauthenticated = await page.evaluate(
    async () =>
      (
        await fetch("/api/session/project-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ view: "porteur" }),
        })
      ).status,
  );
  expect(unauthenticated).toBe(401);

  await authenticatePage(page, { email: ADMIN });
  const invalid = await page.evaluate(async () => {
    const response = await fetch("/api/session/project-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ view: "autre" }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(invalid).toEqual({ status: 400, body: { error: "Vue invalide" } });
  await page.reload();
  await expect(
    page
      .locator("#fr-header-quick-access-item-0")
      .getByRole("combobox", { name: "Vue super admin" }),
  ).toHaveValue("porteur");
});
