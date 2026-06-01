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
  await expect(anomaliesSection.getByText(/350\s*000\s*kWh/)).toBeVisible();
  await expect(
    anomaliesSection.getByRole("heading", {
      name: "Émissions GES avant travaux",
    }),
  ).toBeVisible();
  await expect(anomaliesSection.getByText("Valeur supérieure à")).toBeVisible();
  await expect(anomaliesSection.getByText("1 000tCO₂e")).toBeVisible();
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
    "https://www.demarches-simplifiees.fr/dossiers/12345678",
  );
});
