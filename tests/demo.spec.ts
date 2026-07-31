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
      "Ces vérifications sont automatiques et s'appuient sur les données du dossier.",
    ),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Consommation énergétique avant travaux",
    }),
  ).toBeVisible();
  await expect(anomaliesSection.getByText(/2\s*055\s*650\s*kWh/)).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Émissions GES avant travaux",
    }),
  ).toBeVisible();
  await expect(anomaliesSection.getByText("Valeur supérieure à")).toBeVisible();
  await expect(anomaliesSection.getByText("400kgCO₂e")).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Taux d'économies d'énergie estimé",
    }),
  ).toBeVisible();
  await expect(
    anomaliesSection.getByText("Inférieur au seuil attendu de"),
  ).toBeVisible();
  await expect(anomaliesSection.getByText("40%")).toBeVisible();
  await expect(
    anomaliesSection.getByRole("link", {
      name: "Corriger dans Démarches Numériques",
    }),
  ).toHaveAttribute(
    "href",
    "https://demarche.numerique.gouv.fr/dossiers/99999999",
  );

  let anomaly = anomaliesSection
    .getByRole("listitem")
    .filter({ hasText: "Consommation énergétique avant travaux" });

  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Consommation énergétique avant travaux"),
  ).toBeVisible();
  await expect(dialog.getByLabel("Valeur source")).toHaveValue("2055650");
  await expect(dialog.getByLabel("Valeur source")).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(dialog.getByLabel("Valeur corrigée")).toBeFocused();
  await expect(dialog.getByText("Unité : kWh", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    anomaly.getByRole("button", { name: "Modifier la valeur" }),
  ).toBeFocused();

  const anomalyHeading = anomaliesSection.getByRole("heading", {
    name: "Consommation énergétique avant travaux",
  });
  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog.getByLabel("Valeur corrigée").fill("1 900 000,5");
  await dialog
    .getByRole("button", { name: "Enregistrer la correction" })
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
  await expect(anomalyHeading).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);

  await page.reload();
  await expect(anomaliesSection.getByLabel("2 anomalies")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Consommation énergétique" }),
  ).toContainText(/1\s*900\s*000,5/);

  anomaly = anomaliesSection
    .getByRole("listitem")
    .filter({ hasText: "Émissions GES avant travaux" });
  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog.getByLabel("Valeur corrigée").fill("420");
  await dialog
    .getByRole("button", { name: "Enregistrer la correction" })
    .click();

  await expect(dialog).toBeHidden();
  await expect(anomaly.getByText("420kgCO₂e")).toBeVisible();
  await expect(anomaly.getByText("Valeur supérieure à")).toBeVisible();
  await expect(anomaly.getByText("400kgCO₂e")).toBeVisible();
  await expect(anomaliesSection.getByLabel("2 anomalies")).toBeVisible();

  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog.getByLabel("Valeur source")).toHaveValue("448");
  await expect(dialog.getByLabel("Valeur corrigée")).toHaveValue("420");
  await dialog.getByRole("button", { name: "Annuler" }).click();

  await Promise.all([
    page.waitForEvent("load"),
    page
      .getByRole("button", {
        name: "Réinitialiser les données de démonstration",
      })
      .click(),
  ]);

  await expect(anomaliesSection.getByLabel("3 anomalies")).toBeVisible();
  await expect(anomaliesSection.getByText(/2\s*055\s*650\s*kWh/)).toBeVisible();
  await expect(anomaliesSection.getByText("448kgCO₂e")).toBeVisible();

  await page.reload();
  await expect(anomaliesSection.getByLabel("3 anomalies")).toBeVisible();
  await expect(anomaliesSection.getByText("448kgCO₂e")).toBeVisible();
});

test("fits before/after metric values and actions on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projets/demo");

  const card = page.getByRole("region", {
    name: "Consommation énergétique",
  });

  await expect(
    card.getByRole("button", {
      name: "Modifier la valeur avant travaux",
    }),
  ).toBeVisible();
  await expect(
    card.getByRole("button", {
      name: "Modifier la valeur après travaux",
    }),
  ).toBeVisible();
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
