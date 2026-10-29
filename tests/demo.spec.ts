import { expect, test } from "next/experimental/testmode/playwright/msw";

import { resetDemoDossierMetrics } from "@/db/demoMetrics";
import { DEMO_DOSSIER_NUMBER } from "@/utils/demo";

import { createTestDatabaseClient } from "./setup/db";

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

  const anomaliesSection = page.getByRole("region", {
    name: "Données à vérifier",
  });

  await expect(anomaliesSection).toBeVisible();
  await expect(
    anomaliesSection.getByLabel("3 indicateurs signalés", { exact: true }),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Consommation énergétique avant travaux",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Gain énergétique estimé (en %)",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Émissions de GES avant travaux",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByText("Incohérence forte", { exact: true }),
  ).toBeVisible();
  await expect(anomaliesSection.getByRole("button")).toHaveCount(0);
  await expect(anomaliesSection.getByTestId("impact-section")).toHaveCount(0);

  const impactSection = page.getByTestId("impact-section");
  const energyMetrics = impactSection.getByRole("region", {
    name: "Consommation énergétique",
  });
  const energyBeforeAnomaly = energyMetrics
    .getByRole("group", { name: "Avant travaux" })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(energyBeforeAnomaly).toContainText(
    "Consommation surfacique hors plage",
  );
  await expect(energyBeforeAnomaly).toContainText(
    "Vérifier l'unité ou la surface de référence",
  );

  const energyGainAnomaly = energyMetrics
    .getByRole("group", { name: "Gain énergétique estimé" })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(energyGainAnomaly).toContainText(
    /Inférieur au seuil attendu de\s*40\s*%/,
  );
  await expect(energyGainAnomaly).toContainText(
    "Vérifier les consommations avant et après travaux",
  );

  const gesBeforeAnomaly = impactSection
    .getByRole("region", { name: "Émissions de GES" })
    .getByRole("group", { name: "Avant travaux" })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(gesBeforeAnomaly).toContainText(
    /Valeur supérieure à\s*400\s*kgCO₂e/,
  );
  await expect(gesBeforeAnomaly).toContainText(
    "Probable confusion kg / tonnes CO₂e",
  );

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
  await expect(anomaliesSection.getByRole("status")).toHaveCount(0);
  await expect(
    anomaliesSection.getByLabel("3 indicateurs signalés"),
  ).toBeVisible();
  await expect(
    impactSection.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);
  await expect(energyBeforeAnomaly).toHaveCount(0);

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
  await expect(
    anomaliesSection.getByLabel("3 indicateurs signalés"),
  ).toBeVisible();
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
  await expect(anomaly.getByText("Valeur supérieure à")).toBeVisible();
  await expect(anomaly.getByText("400kgCO₂e")).toBeVisible();
  await expect(
    anomaliesSection.getByLabel("3 indicateurs signalés"),
  ).toBeVisible();
  await expect(gesBeforeAnomaly).toContainText(
    /Valeur supérieure à\s*400\s*kgCO₂e/,
  );

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
  await expect(
    anomaliesSection.getByLabel("3 indicateurs signalés"),
  ).toBeVisible();
  await expect(
    impactSection.getByText(/2\s*055\s*650\s*kWh/).first(),
  ).toBeVisible();
  await expect(impactSection.getByText("448kgCO₂e")).toBeVisible();
  await expect(energyBeforeAnomaly).toContainText(
    "Consommation surfacique hors plage",
  );

  await page.reload();
  await expect(
    anomaliesSection.getByLabel("3 indicateurs signalés"),
  ).toBeVisible();
  await expect(impactSection.getByText("448kgCO₂e")).toBeVisible();
});

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
