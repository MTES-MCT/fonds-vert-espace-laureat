import {
  expect,
  graphql,
  http,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import { appendDossierProgressRevision } from "@/db/dossierProgress";
import type { DossierProgressStatus } from "@/utils/dossierProgress";

import { getDossierData, makeDossierDataWithNumber } from "./fixtures/ds";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ1Data,
  fondsVertFinancesEJ2Data,
  fondsVertLoginData,
} from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const PORTEUR = "porteur.avancement.ui@example.com";
const INSTRUCTEUR = "instructeur.avancement.ui@example.com";
const ADMIN = "alice.doe@example.com";

async function progressRows(dossierNumber: number) {
  const sql = createTestDatabaseClient();
  try {
    return await sql<
      {
        revision: number;
        status: string;
        author_email: string | null;
        created_at: Date;
      }[]
    >`select revision,status,author_email,created_at from dossier_progress_revisions where dossier_number=${dossierNumber} order by revision`;
  } finally {
    await sql.end();
  }
}
async function clearProgress(dossierNumber: number) {
  const sql = createTestDatabaseClient();
  try {
    await sql`delete from dossier_progress_revisions where dossier_number=${dossierNumber}`;
  } finally {
    await sql.end();
  }
}
async function openProgress(page: Page) {
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });
  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Modifier l’avancement",
    exact: true,
  });
  await expect(
    dialog.getByRole("combobox", { name: "Avancement du projet" }),
  ).toBeFocused();
  return dialog;
}
async function saveOrdinaryProgress(page: Page, status: DossierProgressStatus) {
  const dialog = await openProgress(page);
  await dialog
    .getByRole("combobox", { name: "Avancement du projet" })
    .selectOption(status);
  const startedAt = performance.now();
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  return performance.now() - startedAt;
}

test.beforeEach(async ({ page, msw }, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await clearProgress(dossierNumber);
  await deleteStoredDossierMetrics(dossierNumber);
  const dossier = {
    ...makeDossierDataWithNumber(dossierNumber).data.dossier,
    usager: { email: PORTEUR },
    groupeInstructeur: { instructeurs: [{ email: INSTRUCTEUR }] },
  };
  msw.use(
    ds.query("getDossier", () => HttpResponse.json({ data: { dossier } })),
    ds.query("getDossierAccess", () =>
      HttpResponse.json({
        data: {
          dossier: {
            demandeur: getDossierData.data.dossier.demandeur,
            usager: dossier.usager,
            groupeInstructeur: dossier.groupeInstructeur,
          },
        },
      }),
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
          socle_commun: {
            ...fondsVertDossierData.data.socle_commun,
            statut_realisation_projet: "Terminé",
          },
        },
      }),
    ),
    http.get("http://fondsvert/fonds_vert/v2/finances/2105212345", () =>
      HttpResponse.json(fondsVertFinancesEJ1Data),
    ),
    http.get("http://fondsvert/fonds_vert/v2/finances/2106789012", () =>
      HttpResponse.json(fondsVertFinancesEJ2Data),
    ),
  );
  await authenticatePage(page, { email: PORTEUR });
});

test.afterEach(async ({}, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await clearProgress(dossierNumber);
  await deleteStoredDossierMetrics(dossierNumber);
});

test("shares progress saved from the project list between the porteur, instructeur and administrator", async ({
  page,
}, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await page.goto("/projets");
  await page
    .getByRole("row")
    .filter({ hasText: String(dossierNumber) })
    .getByRole("link", { name: "Ouvrir" })
    .click();
  const section = page.getByTestId("project-progress-row");
  await expect(
    section.locator(".fr-badge").filter({ hasText: /^Non renseigné$/ }),
  ).toBeVisible();
  await expect(
    section.locator(".fr-badge").filter({ hasText: /^Terminé$/ }),
  ).toHaveCount(0);
  await expect(
    section.getByRole("tooltip", { includeHidden: true }),
  ).toHaveCount(0);
  expect(await progressRows(dossierNumber)).toEqual([]);

  const saveDurations = [await saveOrdinaryProgress(page, "Non-commencé")];
  await page.reload();
  const badge = section
    .locator(".fr-badge")
    .filter({ hasText: /^Non-commencé$/ });
  await expect(badge).toBeVisible();
  const dateTooltip = section.getByRole("tooltip", { includeHidden: true });
  await expect(dateTooltip).toBeHidden();

  await badge.hover();
  await expect(dateTooltip).toBeVisible();
  await expect(dateTooltip).toContainText("Dernière modification");

  await section.getByRole("button", { name: "Modifier l’avancement" }).hover();
  await expect(dateTooltip).toBeHidden();

  const dialog = await openProgress(page);
  await expect(dialog.getByText(/^Dernière modification/)).toBeVisible();
  await dialog.getByRole("button", { name: "Annuler" }).click();

  await page.context().clearCookies();
  await authenticatePage(page, { email: INSTRUCTEUR });
  await page.goto("/projets");
  await page
    .getByRole("row")
    .filter({ hasText: String(dossierNumber) })
    .getByRole("link", { name: "Ouvrir" })
    .click();
  await expect(
    section.locator(".fr-badge").filter({ hasText: /^Non-commencé$/ }),
  ).toBeVisible();
  saveDurations.push(await saveOrdinaryProgress(page, "Bloqué"));

  await page.context().clearCookies();
  await authenticatePage(page, { email: ADMIN });
  await page.reload();
  await expect(
    section.locator(".fr-badge").filter({ hasText: /^Bloqué$/ }),
  ).toBeVisible();
  saveDurations.push(
    await saveOrdinaryProgress(page, "En cours de réalisation"),
  );
  await page.reload();
  await expect(
    section
      .locator(".fr-badge")
      .filter({ hasText: /^En cours de réalisation$/ }),
  ).toBeVisible();
  expect(await progressRows(dossierNumber)).toEqual([
    {
      revision: 1,
      status: "Non-commencé",
      author_email: PORTEUR,
      created_at: expect.any(Date),
    },
    {
      revision: 2,
      status: "Bloqué",
      author_email: INSTRUCTEUR,
      created_at: expect.any(Date),
    },
    {
      revision: 3,
      status: "En cours de réalisation",
      author_email: ADMIN,
      created_at: expect.any(Date),
    },
  ]);
  const reloadDurations: number[] = [];
  for (let reload = 0; reload < 3; reload += 1) {
    const startedAt = performance.now();
    await page.reload();
    await expect(
      section
        .locator(".fr-badge")
        .filter({ hasText: /^En cours de réalisation$/ }),
    ).toBeVisible();
    reloadDurations.push(performance.now() - startedAt);
  }
  const measurements = {
    scenario: "dossier-progress-browser",
    externalSources: "simulated DN/FV",
    database: "local PostgreSQL",
    saveDurationsMs: saveDurations,
    reloadDurationsMs: reloadDurations,
  };
  console.log(JSON.stringify(measurements));
  await testInfo.attach("dossier-progress-browser-performance.json", {
    body: JSON.stringify(measurements),
    contentType: "application/json",
  });
});

for (const finalStatus of ["Terminé", "Abandonné"] as const) {
  test(`confirms a move to ${finalStatus}, allows cancellation and a later return`, async ({
    page,
  }, testInfo) => {
    const dossierNumber = 89880032 + testInfo.parallelIndex;
    await page.goto(`/projets/${dossierNumber}`);
    let dialog = await openProgress(page);
    await dialog
      .getByRole("combobox", { name: "Avancement du projet" })
      .selectOption(finalStatus);
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    const confirmation = page.getByRole("dialog", {
      name: "Confirmer l’avancement",
    });
    await expect(
      confirmation.getByText(`Passer l’avancement à « ${finalStatus} » ?`),
    ).toBeFocused();
    expect(await progressRows(dossierNumber)).toEqual([]);
    await confirmation.getByRole("button", { name: "Annuler" }).click();
    await expect(confirmation).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Modifier l’avancement" }),
    ).toBeFocused();
    expect(await progressRows(dossierNumber)).toEqual([]);

    dialog = await openProgress(page);
    await dialog
      .getByRole("combobox", { name: "Avancement du projet" })
      .selectOption(finalStatus);
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await confirmation
      .getByRole("button", { name: "Confirmer", exact: true })
      .click();
    await expect(confirmation).toBeHidden();
    await expect(
      page
        .getByTestId("project-progress-row")
        .locator(".fr-badge")
        .filter({ hasText: finalStatus }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Données d’impact", exact: true })
      .click();
    await expect(
      page
        .getByTestId("impact-section")
        .getByRole("button", { name: "Modifier", exact: true })
        .first(),
    ).toBeEnabled();

    await page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Synthèse du projet", exact: true })
      .click();
    await saveOrdinaryProgress(page, "Non-commencé");
    expect(
      (await progressRows(dossierNumber)).map(
        ({ revision, status, author_email }) => ({
          revision,
          status,
          author_email,
        }),
      ),
    ).toEqual([
      { revision: 1, status: finalStatus, author_email: PORTEUR },
      { revision: 2, status: "Non-commencé", author_email: PORTEUR },
    ]);
  });
}

test("discards closed edits, keeps unchanged progress and announces a failed save", async ({
  page,
}, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await page.goto(`/projets/${dossierNumber}`);
  let dialog = await openProgress(page);
  await dialog
    .getByRole("combobox", { name: "Avancement du projet" })
    .selectOption("Bloqué");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Modifier l’avancement" }),
  ).toBeFocused();
  expect(await progressRows(dossierNumber)).toEqual([]);

  dialog = await openProgress(page);
  await expect(dialog.getByRole("combobox")).toHaveValue("");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Sélectionnez un avancement.",
  );
  await dialog.getByRole("combobox").selectOption("En cours de réalisation");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await page.reload();
  const before = await progressRows(dossierNumber);

  dialog = await openProgress(page);
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("status").filter({ hasText: "Avancement enregistré" }),
  ).toHaveCount(0);
  expect(await progressRows(dossierNumber)).toEqual(before);

  dialog = await openProgress(page);
  await dialog.getByRole("combobox").selectOption("Bloqué");
  await page.route(`**/api/projets/${dossierNumber}/progress`, (route) =>
    route.fulfill({ status: 503, body: "Service indisponible" }),
  );
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "L’avancement n’a pas pu être enregistré.",
  );
  await expect(dialog.getByRole("combobox")).toBeFocused();
  expect(await progressRows(dossierNumber)).toEqual(before);
  await dialog.getByRole("button", { name: "Fermer" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Modifier l’avancement" }),
  ).toBeFocused();
});

test("preserves the opening revision across refresh and replaces an obsolete entry on conflict", async ({
  page,
}, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await page.goto(`/projets/${dossierNumber}`);
  const dialog = await openProgress(page);
  await dialog.getByRole("combobox").selectOption("Non-commencé");
  await appendDossierProgressRevision({
    numeroDossier: dossierNumber,
    status: "Bloqué",
    expectedRevision: 0,
    authorEmail: INSTRUCTEUR,
    confirmed: false,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const section = page.getByTestId("project-progress-row");
  await expect(
    section
      .locator(".fr-badge")
      .filter({ hasText: /^Bloqué$/ })
      .first(),
  ).toBeVisible();
  await expect(dialog.getByRole("combobox")).toHaveValue("Non-commencé");

  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "L’avancement actuel a été chargé",
  );
  await expect(dialog.getByRole("combobox")).toHaveValue("Bloqué");
  await expect(dialog.getByRole("combobox")).toBeFocused();
  expect(await progressRows(dossierNumber)).toHaveLength(1);
  await expect(
    page.getByRole("status").filter({ hasText: "Avancement enregistré" }),
  ).toHaveCount(0);

  await dialog.getByRole("combobox").selectOption("En cours de réalisation");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  expect(
    (await progressRows(dossierNumber)).map(
      ({ revision, status, author_email }) => ({
        revision,
        status,
        author_email,
      }),
    ),
  ).toEqual([
    { revision: 1, status: "Bloqué", author_email: INSTRUCTEUR },
    { revision: 2, status: "En cours de réalisation", author_email: PORTEUR },
  ]);
});

test("refreshes a newer revision even when its server date has the same millisecond", async ({
  page,
}, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await page.goto(`/projets/${dossierNumber}`);
  await saveOrdinaryProgress(page, "Non-commencé");

  await appendDossierProgressRevision({
    numeroDossier: dossierNumber,
    status: "Bloqué",
    expectedRevision: 1,
    authorEmail: INSTRUCTEUR,
    confirmed: false,
  });
  const sql = createTestDatabaseClient();
  try {
    await sql`update dossier_progress_revisions set created_at =
      (select created_at from dossier_progress_revisions where dossier_number=${dossierNumber} and revision=1)
      where dossier_number=${dossierNumber} and revision=2`;
  } finally {
    await sql.end();
  }

  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const section = page.getByTestId("project-progress-row");
  await expect(section.locator(".fr-badge")).toHaveText("Bloqué");
  const dialog = await openProgress(page);
  await expect(dialog.getByRole("combobox")).toHaveValue("Bloqué");
  await dialog.getByRole("combobox").selectOption("En cours de réalisation");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  expect((await progressRows(dossierNumber)).at(-1)).toMatchObject({
    revision: 3,
    status: "En cours de réalisation",
    author_email: PORTEUR,
  });
});

test("keeps the progress editor within a mobile viewport and its keyboard focus within the modal", async ({
  page,
}, testInfo) => {
  const dossierNumber = 89880032 + testInfo.parallelIndex;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/projets/${dossierNumber}`);
  const dialog = await openProgress(page);
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  for (let tab = 0; tab < 7; tab += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement)),
      )
      .toBe(true);
  }
  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Modifier l’avancement" }),
  ).toBeFocused();
});
