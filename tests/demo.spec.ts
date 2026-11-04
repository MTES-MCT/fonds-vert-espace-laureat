import {
  expect,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import { resetDemoDossierMetrics } from "@/db/demoMetrics";
import {
  appendDossierMetricRevision,
  getDossierMetricRevisionTargets,
} from "@/db/dossierMetrics";
import { DEMO_DOSSIER_NUMBER } from "@/utils/demo";

import { createTestDatabaseClient } from "./setup/db";

test.describe.configure({ mode: "default" });

const CORRECTION_NOTE =
  "Corrigée, en attente de la prochaine analyse Fonds vert.";

function impactTab(page: Page) {
  return page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true });
}

test("demo page loads, corrects and persists its database-backed metrics", async ({
  page,
}) => {
  await resetDemoDossierMetrics();

  await page.goto("/projets/demo");
  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });

  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    page.getByRole("region", { name: "Signalements Fonds vert" }),
  ).toHaveCount(0);

  const impactSection = page.getByTestId("impact-section");
  const energyMetrics = impactSection.getByRole("region", {
    name: "Consommation énergétique",
  });
  const energyBeforeAnomaly = energyMetrics
    .getByRole("group", { name: "Avant travaux" })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(energyBeforeAnomaly).toHaveCount(1);
  await expect(energyBeforeAnomaly).toHaveText("Anomalie statistique");

  const energyGainAnomaly = energyMetrics
    .getByRole("group", { name: "Gain énergétique estimé" })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(energyGainAnomaly).toHaveText(
    "Anomalie statistiqueÀ vérifier avec les consommations avant et après travaux.",
  );
  await expect(
    energyMetrics
      .getByRole("group", { name: "Gain énergétique estimé" })
      .getByRole("button", { name: "Modifier", exact: true }),
  ).toBeVisible();

  const gesBeforeAnomaly = impactSection
    .getByRole("region", { name: "Émissions de GES" })
    .getByRole("group", { name: "Avant travaux" })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(gesBeforeAnomaly).toHaveText("Incohérence forte");

  let anomaly = energyMetrics.getByRole("group", {
    name: "Avant travaux",
    exact: true,
  });

  await anomaly.getByRole("button", { name: "Modifier" }).click();
  let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Consommation énergétique avant travaux"),
  ).toBeVisible();
  await expect(dialog.getByLabel("Valeur source")).toHaveCount(0);
  await expect(
    dialog.getByLabel("Consommation énergétique avant travaux"),
  ).toBeFocused();
  await expect(dialog.getByText("Unité : kWh", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toBeHidden();
  await expect(anomaly.getByRole("button", { name: "Modifier" })).toBeFocused();

  await anomaly.getByRole("button", { name: "Modifier" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog
    .getByLabel("Consommation énergétique avant travaux")
    .fill("1 900 000,5");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("status").filter({
      hasText: "Correction enregistrée",
    }),
  ).toBeVisible();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    impactSection.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);
  await expect(energyBeforeAnomaly).toHaveCount(1);
  await expect(
    energyMetrics
      .getByRole("group", { name: "Avant travaux" })
      .getByText(CORRECTION_NOTE, { exact: true }),
  ).toBeVisible();

  const sql = createTestDatabaseClient();
  try {
    const revisions =
      await sql`select revision, author_email from dossier_metric_revisions
      where dossier_number = ${DEMO_DOSSIER_NUMBER}
        and metric_code = 'conso_energetique_avant_travaux' order by revision`;
    expect(revisions).toEqual([
      { revision: 1, author_email: null },
      { revision: 2, author_email: null },
    ]);
  } finally {
    await sql.end();
  }

  await page.reload();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    impactSection.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);

  anomaly = impactSection
    .getByRole("region", { name: "Émissions de GES", exact: true })
    .getByRole("group", { name: "Avant travaux", exact: true });
  await anomaly.getByRole("button", { name: "Modifier" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog.getByLabel("Émissions de GES avant travaux").fill("420");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();

  await expect(dialog).toBeHidden();
  await expect(anomaly.getByText("420kgCO₂e")).toBeVisible();
  await expect(gesBeforeAnomaly).toContainText("Incohérence forte");
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(gesBeforeAnomaly).toHaveText(/^Incohérence forte/);

  await anomaly.getByRole("button", { name: "Modifier" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog.getByLabel("Valeur source")).toHaveCount(0);
  await expect(dialog.getByLabel("Émissions de GES avant travaux")).toHaveValue(
    "420",
  );
  await dialog.getByRole("button", { name: "Annuler" }).click();

  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Synthèse du projet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  const progressDialog = page.getByRole("dialog", {
    name: "Modifier l’avancement",
    exact: true,
  });
  await progressDialog
    .getByRole("combobox", { name: "Avancement du projet" })
    .selectOption("En cours de réalisation");
  await progressDialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(progressDialog).toBeHidden();
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Avancement du projet" })
      .locator(".fr-badge")
      .filter({ hasText: /^En cours de réalisation$/ }),
  ).toBeVisible();
  const progressSql = createTestDatabaseClient();
  try {
    expect(
      await progressSql`select status, author_email from dossier_progress_revisions where dossier_number=${DEMO_DOSSIER_NUMBER}`,
    ).toEqual([{ status: "En cours de réalisation", author_email: null }]);
  } finally {
    await progressSql.end();
  }

  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  await progressDialog.getByRole("combobox").selectOption("Bloqué");
  const resetPage = await page.context().newPage();
  await resetPage.goto("/projets/demo");
  await Promise.all([
    resetPage.waitForEvent("load"),
    resetPage.getByRole("button", { name: "Réinitialiser la démo" }).click(),
  ]);
  await resetPage.close();

  await progressDialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(progressDialog.getByRole("alert")).toContainText(
    "L’avancement actuel a été chargé",
  );
  await expect(progressDialog.getByRole("combobox")).toHaveValue("");
  await progressDialog.getByRole("button", { name: "Annuler" }).click();
  const progressSection = page.getByRole("region", {
    name: "Avancement du projet",
  });
  await expect(
    progressSection.getByText("Non renseigné", { exact: true }),
  ).toBeVisible();
  await expect(progressSection.locator(".fr-badge")).toHaveCount(0);

  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  await progressDialog.getByRole("combobox").selectOption("Non-commencé");
  await progressDialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(progressDialog).toBeHidden();
  await expect(progressSection.locator(".fr-badge")).toHaveText("Non-commencé");
  const resetProgressSql = createTestDatabaseClient();
  try {
    expect(
      await resetProgressSql`select revision,status,author_email from dossier_progress_revisions where dossier_number=${DEMO_DOSSIER_NUMBER}`,
    ).toEqual([{ revision: 1, status: "Non-commencé", author_email: null }]);
  } finally {
    await resetProgressSql.end();
  }

  await Promise.all([
    page.waitForEvent("load"),
    page
      .getByRole("button", {
        name: "Réinitialiser la démo",
      })
      .click(),
  ]);

  await expect(
    page
      .getByRole("region", { name: "Avancement du projet" })
      .getByText("Non renseigné", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    impactSection.getByText(/2\s*055\s*650\s*kWh/).first(),
  ).toBeVisible();
  await expect(impactSection.getByText("448kgCO₂e")).toBeVisible();
  await expect(energyBeforeAnomaly).toHaveCount(1);

  await page.reload();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(impactSection.getByText("448kgCO₂e")).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`les outils de démonstration flottent en bas à droite à ${width} px sans élargir la page`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projets/demo/impact");

    const tools = page.getByRole("complementary", {
      name: "Outils de démonstration",
    });
    await expect(
      tools.getByRole("combobox", { name: "Réponse Fonds vert simulée" }),
    ).toBeVisible();
    await expect(
      tools.getByRole("button", { name: "Réinitialiser la démo" }),
    ).toBeVisible();
    await expect(page.getByTestId("project-frame")).not.toContainText(
      "Réponse Fonds vert simulée",
    );

    await expect(tools).toHaveCSS("position", "fixed");
    const bounds = await tools.boundingBox();
    if (!bounds) throw new Error("Les outils doivent être affichés.");
    expect(width - (bounds.x + bounds.width)).toBeLessThanOrEqual(16);
    expect(900 - (bounds.y + bounds.height)).toBeLessThanOrEqual(16);
    await expect
      .poll(() =>
        tools.evaluate((element) => element.scrollWidth <= element.clientWidth),
      )
      .toBe(true);
  });
}

for (const width of [1440, 390]) {
  test(`le lecteur trouve avant et après travaux et les données liées sur des lignes consécutives à ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projets/demo/impact");
    const values = page.getByTestId("impact-section");
    const energy = values.getByRole("region", {
      name: "Consommation énergétique",
      exact: true,
    });

    for (const [first, second] of [
      [
        energy.getByRole("group", { name: "Avant travaux", exact: true }),
        energy.getByRole("group", { name: "Après travaux", exact: true }),
      ],
      [
        values.getByRole("region", {
          name: "Surface du bâtiment avant projet",
          exact: true,
        }),
        values.getByRole("region", { name: "Type de surface", exact: true }),
      ],
      [
        values.getByRole("region", {
          name: "Nature des opérations",
          exact: true,
        }),
        values.getByRole("region", {
          name: "Types des bâtiments",
          exact: true,
        }),
      ],
    ]) {
      const firstBounds = await first.boundingBox();
      const secondBounds = await second.boundingBox();
      if (!firstBounds || !secondBounds) {
        throw new Error("Les deux données liées doivent être affichées.");
      }

      expect(Math.abs(secondBounds.x - firstBounds.x)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(secondBounds.y - (firstBounds.y + firstBounds.height)),
      ).toBeLessThanOrEqual(2);
    }
  });
}

for (const [situation, width, besideValue] of [
  ["dans une colonne à part sur grand écran", 1440, true],
  ["sous la valeur sur mobile", 390, false],
] as const) {
  test(`le lecteur voit les signalements d’une valeur ${situation}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projets/demo/impact");
    const before = page
      .getByTestId("impact-section")
      .getByRole("region", { name: "Consommation énergétique", exact: true })
      .getByRole("group", { name: "Avant travaux", exact: true });

    const value = await before.getByTestId("valeur-0").boundingBox();
    const note = await before
      .getByRole("note", { name: "Anomalie détectée" })
      .first()
      .boundingBox();
    if (!value || !note) {
      throw new Error("La valeur et son signalement doivent être affichés.");
    }

    if (besideValue) {
      expect(note.x).toBeGreaterThan(value.x + value.width);
      expect(Math.abs(note.y - value.y)).toBeLessThanOrEqual(8);
    } else {
      expect(note.y).toBeGreaterThanOrEqual(value.y + value.height);
    }
  });
}

test("fits related energy metric values and actions on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projets/demo");
  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();

  const card = page
    .getByTestId("impact-section")
    .getByRole("region", { name: "Consommation énergétique" });

  for (const label of [
    "Avant travaux",
    "Après travaux",
    "Gain énergétique estimé",
  ]) {
    await expect(
      card
        .getByRole("group", { name: label })
        .getByRole("button", { name: "Modifier" }),
    ).toBeVisible();
  }
  await expect
    .poll(() =>
      card.evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      card.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= window.innerWidth;
      }),
    )
    .toBe(true);
});

test("keeps demo corrections until a distinct simulated Fonds vert response is selected", async ({
  page,
}) => {
  await resetDemoDossierMetrics();
  await page.goto("/projets/demo");
  const navigation = page.getByRole("navigation", { name: "Pages du projet" });
  await navigation
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();

  const before = page
    .getByTestId("impact-section")
    .getByRole("region", { name: "Consommation énergétique", exact: true })
    .getByRole("group", { name: "Avant travaux", exact: true });
  const modifier = before.getByRole("button", {
    name: "Modifier",
    exact: true,
  });
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });
  await modifier.click();
  const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog
    .getByLabel("Consommation énergétique avant travaux")
    .fill("2000000");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(modifier).toBeFocused();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    before.getByRole("note", { name: "Anomalie détectée" }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    before.getByText(CORRECTION_NOTE, { exact: true }),
  ).toBeVisible();
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /2\s*000\s*000\s*kWh/,
  );

  const source = page.getByRole("combobox", {
    name: "Réponse Fonds vert simulée",
  });
  await source.selectOption("recalculated");
  await expect(page).toHaveURL(
    /\/projets\/demo\/impact\?fondsVert=recalculated$/,
  );
  await expect(impactTab(page)).not.toHaveAttribute("aria-describedby");
  await expect(
    before.getByRole("note", { name: "Anomalie détectée" }),
  ).toHaveCount(0);
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /2\s*000\s*000\s*kWh/,
  );
  await navigation
    .getByRole("link", { name: "Synthèse du projet", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projets\/demo\?fondsVert=recalculated$/);
  await navigation
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/projets\/demo\/impact\?fondsVert=recalculated$/,
  );
  await expect(
    page.getByRole("heading", { name: "Données d’impact", exact: true }),
  ).toBeVisible();
  await expect(source).toHaveValue("recalculated");

  await source.selectOption("unavailable");
  await expect(page.locator(".fr-alert")).toContainText(
    "Les valeurs déjà enregistrées restent consultables",
  );
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /2\s*000\s*000\s*kWh/,
  );

  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Réinitialiser la démo" }).click(),
  ]);
  await expect(page).toHaveURL(/\/projets\/demo\/impact$/);
  await expect(source).toHaveValue("initial");
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(before.getByText(CORRECTION_NOTE, { exact: true })).toHaveCount(
    0,
  );
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /2\s*055\s*650\s*kWh/,
  );
  await expect(
    getDossierMetricRevisionTargets({ numeroDossier: DEMO_DOSSIER_NUMBER }),
  ).resolves.toMatchObject({
    conso_energetique_avant_travaux: { revision: 1, effectiveValue: 2055650 },
  });
});

test("replaces a demo metric after another tab resets its revisions and permits a fresh correction", async ({
  page,
}) => {
  await resetDemoDossierMetrics();
  await page.goto("/projets/demo/impact");
  const before = page
    .getByTestId("impact-section")
    .getByRole("region", { name: "Consommation énergétique", exact: true })
    .getByRole("group", { name: "Avant travaux", exact: true });
  const modifier = before.getByRole("button", {
    name: "Modifier",
    exact: true,
  });
  const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  const input = dialog.getByLabel("Consommation énergétique avant travaux");
  for (const value of ["2000000", "1900000"]) {
    await modifier.click();
    await input.fill(value);
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }
  await page.reload();
  await modifier.click();
  await input.fill("1800000");

  const resetPage = await page.context().newPage();
  await resetPage.goto("/projets/demo");
  await Promise.all([
    resetPage.waitForEvent("load"),
    resetPage.getByRole("button", { name: "Réinitialiser la démo" }).click(),
  ]);
  await resetPage.close();

  const submittedRevisions: number[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/metrics/conso_energetique_avant_travaux")
    ) {
      submittedRevisions.push(request.postDataJSON().expectedRevision);
    }
  });
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "La valeur actuelle a été chargée",
  );
  await expect(input).toHaveValue("2055650");
  await expect(input).toBeFocused();
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /2\s*055\s*650\s*kWh/,
  );
  expect(submittedRevisions).toEqual([3]);
  await expect(
    getDossierMetricRevisionTargets({ numeroDossier: DEMO_DOSSIER_NUMBER }),
  ).resolves.toMatchObject({
    conso_energetique_avant_travaux: { revision: 1, effectiveValue: 2055650 },
  });

  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(modifier).toBeFocused();
  await modifier.press("Enter");
  await expect(input).toHaveValue("2055650");
  await input.fill("1800000");
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(modifier).toBeFocused();
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /1\s*800\s*000\s*kWh/,
  );
  expect(submittedRevisions).toEqual([3, 1]);
  await expect(
    getDossierMetricRevisionTargets({ numeroDossier: DEMO_DOSSIER_NUMBER }),
  ).resolves.toMatchObject({
    conso_energetique_avant_travaux: { revision: 2, effectiveValue: 1800000 },
  });
  const sql = createTestDatabaseClient();
  try {
    expect(
      await sql`select revision,author_email from dossier_metric_revisions
      where dossier_number=${DEMO_DOSSIER_NUMBER} and metric_code='conso_energetique_avant_travaux' order by revision`,
    ).toEqual([
      { revision: 1, author_email: null },
      { revision: 2, author_email: null },
    ]);
  } finally {
    await sql.end();
  }
  const source = page.getByRole("combobox", {
    name: "Réponse Fonds vert simulée",
  });
  await appendDossierMetricRevision({
    numeroDossier: DEMO_DOSSIER_NUMBER,
    metricCode: "conso_energetique_avant_travaux",
    value: 1700000,
    expectedRevision: 2,
    authorEmail: null,
  });
  await source.selectOption("recalculated");
  await expect(impactTab(page)).not.toHaveAttribute("aria-describedby");
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /1\s*700\s*000\s*kWh/,
  );
  await modifier.click();
  await expect(input).toHaveValue("1700000");
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await page.reload();
  await expect(before.getByTestId("valeur-0")).toHaveText(
    /1\s*700\s*000\s*kWh/,
  );
  await resetDemoDossierMetrics();
});
