import {
  expect,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { resetDemoDossierMetrics } from "@/db/demoMetrics";

import { gristChampsDS } from "./fixtures/grist";

test.use({
  mswHandlers: [
    [
      http.get("http://grist/docs/id/tables/Champs_DS/records", () => {
        return HttpResponse.json(gristChampsDS);
      }),
    ],
    { scope: "test" },
  ],
});

test("demo page loads, corrects and persists its database-backed metrics", async ({
  page,
  msw,
}) => {
  await resetDemoDossierMetrics();

  let gristRequestCount = 0;
  msw.use(
    http.get("http://grist/docs/id/tables/Champs_DS/records", () => {
      gristRequestCount += 1;
      return HttpResponse.json(gristChampsDS);
    }),
  );

  await page.goto("/projets/demo");
  expect(gristRequestCount).toBe(0);

  const anomaliesSection = page.getByRole("region", {
    name: "Données à vérifier",
  });

  await expect(anomaliesSection).toBeVisible();
  await expect(
    anomaliesSection.getByLabel("3 anomalies", { exact: true }),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByText(
      "Ces vérifications sont automatiques et s'appuient sur les données du dossier. Elles servent à fiabiliser les indicateurs d'impact. Vous pouvez corriger une valeur ici.",
    ),
  ).toBeVisible();
  const anomalousEnergyMetrics = anomaliesSection.getByRole("region", {
    name: "Consommation énergétique",
  });
  const anomalousEnergyBefore = anomalousEnergyMetrics.getByRole("group", {
    name: "Avant travaux",
  });
  const anomalousEnergyGain = anomalousEnergyMetrics.getByRole("group", {
    name: "Gain énergétique estimé",
  });
  const anomalousGesMetrics = anomaliesSection.getByRole("region", {
    name: "Émissions de GES",
  });
  const anomalousGesBefore = anomalousGesMetrics.getByRole("group", {
    name: "Avant travaux",
  });

  await expect(anomalousEnergyMetrics).toBeVisible();
  await expect(anomalousEnergyBefore).toContainText(/2\s*055\s*650\s*kWh/);
  await expect(anomalousEnergyGain).toContainText(/32\s*%/);
  await expect(anomalousGesBefore).toContainText(/448\s*kgCO₂e/);
  await expect(
    anomaliesSection.getByRole("group", { name: "Après travaux" }),
  ).toHaveCount(0);
  await expect(
    anomaliesSection.getByRole("heading", { name: "Gestion de proximité" }),
  ).toHaveCount(0);
  await expect(anomaliesSection.getByText("Valeur supérieure à")).toBeVisible();
  await expect(anomaliesSection.getByText("400kgCO₂e")).toBeVisible();
  await expect(
    anomaliesSection.getByText("Inférieur au seuil attendu de"),
  ).toBeVisible();
  await expect(anomaliesSection.getByText("40%")).toBeVisible();
  await expect(
    anomaliesSection.getByRole("link", {
      name: "Corriger dans Démarches Numériques",
    }),
  ).toHaveCount(0);

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

  let anomaly = anomalousEnergyBefore;

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
    anomaliesSection.getByRole("status").filter({
      hasText: "Correction enregistrée",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Correction enregistrée" }),
  ).toHaveCount(1);
  await expect(anomaliesSection.getByLabel("2 anomalies")).toBeVisible();
  await expect(anomalousEnergyBefore).toHaveCount(0);
  await expect(
    impactSection.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);
  await expect(energyBeforeAnomaly).toHaveCount(0);

  await page.reload();
  await expect(anomaliesSection.getByLabel("2 anomalies")).toBeVisible();
  await expect(
    impactSection.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);

  anomaly = anomalousGesBefore;
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
  await expect(anomaliesSection.getByLabel("2 anomalies")).toBeVisible();
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

  await Promise.all([
    page.waitForEvent("load"),
    page
      .getByRole("button", {
        name: "Réinitialiser la démo",
      })
      .click(),
  ]);

  await expect(anomaliesSection.getByLabel("3 anomalies")).toBeVisible();
  await expect(anomaliesSection.getByText(/2\s*055\s*650\s*kWh/)).toBeVisible();
  await expect(anomaliesSection.getByText("448kgCO₂e")).toBeVisible();
  await expect(energyBeforeAnomaly).toContainText(
    "Consommation surfacique hors plage",
  );

  await page.reload();
  await expect(anomaliesSection.getByLabel("3 anomalies")).toBeVisible();
  await expect(anomaliesSection.getByText("448kgCO₂e")).toBeVisible();
});

test("fits related energy metric values and actions on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projets/demo");

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
