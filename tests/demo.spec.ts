import {
  expect,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

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

test("demo page displays the mocked anomalies section", async ({ page }) => {
  await page.goto("/projets/demo");

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
    "https://demarche.numerique.gouv.fr/dossiers/12345678",
  );
});

test("opens and cancels a metric correction with accessible controls", async ({
  page,
}) => {
  await page.goto("/projets/demo");

  const anomaliesSection = page.getByRole("region", {
    name: "Données à vérifier",
  });
  const anomaly = anomaliesSection
    .getByRole("listitem")
    .filter({ hasText: "Consommation énergétique avant travaux" });

  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();

  const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
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
});

test("removes a resolved anomaly after a French numeric correction", async ({
  page,
}) => {
  await page.goto("/projets/demo");

  const anomaliesSection = page.getByRole("region", {
    name: "Données à vérifier",
  });
  const anomalyHeading = anomaliesSection.getByRole("heading", {
    name: "Consommation énergétique avant travaux",
  });
  const anomaly = anomaliesSection
    .getByRole("listitem")
    .filter({ hasText: "Consommation énergétique avant travaux" });

  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
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
  await expect(anomaliesSection.getByLabel("2 anomalies")).toBeVisible();
  await expect(anomalyHeading).toHaveCount(0);
});

test("updates an unresolved anomaly and keeps its source value", async ({
  page,
}) => {
  await page.goto("/projets/demo");

  const anomaliesSection = page.getByRole("region", {
    name: "Données à vérifier",
  });
  const anomaly = anomaliesSection
    .getByRole("listitem")
    .filter({ hasText: "Émissions GES avant travaux" });

  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog.getByLabel("Valeur corrigée").fill("420");
  await dialog
    .getByRole("button", { name: "Enregistrer la correction" })
    .click();

  await expect(dialog).toBeHidden();
  await expect(anomaly.getByText("420kgCO₂e")).toBeVisible();
  await expect(anomaly.getByText("Valeur supérieure à")).toBeVisible();
  await expect(anomaly.getByText("400kgCO₂e")).toBeVisible();
  await expect(anomaliesSection.getByLabel("3 anomalies")).toBeVisible();

  await anomaly.getByRole("button", { name: "Modifier la valeur" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog.getByLabel("Valeur source")).toHaveValue("448");
  await expect(dialog.getByLabel("Valeur corrigée")).toHaveValue("420");
});
