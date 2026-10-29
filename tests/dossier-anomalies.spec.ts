import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { makeDossierDataWithNumber } from "./fixtures/ds";
import { fondsVertDossierData, fondsVertLoginData } from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import {
  deleteStoredDossierMetrics,
  importStoredDossierMetricsIfMissing,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const PORTEUR = "porteur.signalements@example.com";
const noAnomalies = {
  est_anomalie: false,
  est_error: false,
  anomalie_demarche_list: [],
  anomalie_indicateur_list: [],
  error_indicateur_list: [],
};
const metrics = {
  conso_energetique_avant_travaux: {
    label: "Consommation énergétique avant travaux",
    unite: "kWh",
    valeur_estimee: 100,
  },
  conso_energetique_apres_travaux: {
    label: "Consommation énergétique après travaux",
    unite: "kWh",
    valeur_estimee: 70,
  },
};

function fondsVertResponse(anomalies: unknown, avertissements: unknown = []) {
  return http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () =>
    HttpResponse.json({
      data: {
        ...fondsVertDossierData.data,
        information_financiere: { informations_engagement: [] },
        metrique_specifique: metrics,
        anomalies,
        avertissements,
      },
    }),
  );
}

test.beforeEach(async ({ page, msw }, testInfo) => {
  const dossierNumber = 89330260 + testInfo.parallelIndex;
  await deleteStoredDossierMetrics(dossierNumber);
  const dossier = {
    ...makeDossierDataWithNumber(dossierNumber).data.dossier,
    usager: { email: PORTEUR },
  };
  msw.use(
    ds.query("getDossier", () => HttpResponse.json({ data: { dossier } })),
    http.post("http://fondsvert/fonds_vert/login", () =>
      HttpResponse.json(fondsVertLoginData),
    ),
    fondsVertResponse(noAnomalies),
  );
  await authenticatePage(page, { email: PORTEUR });
});

test.afterEach(async ({}, testInfo) => {
  await deleteStoredDossierMetrics(89330260 + testInfo.parallelIndex);
});

test("la page Impact compte les indicateurs une fois et conserve leurs catégories, inconnus, contexte et avertissements", async ({
  page,
  msw,
}, testInfo) => {
  msw.use(
    fondsVertResponse(
      {
        est_anomalie: true,
        est_error: true,
        anomalie_demarche_list: [
          "Rénovation énergétique",
          "Démarche complémentaire",
        ],
        anomalie_indicateur_list: [
          "Consommation énergétique avant travaux",
          "Gain énergétique estimé (en %)",
          "Indicateur composite inconnu, à conserver",
          "Surface du batiment après le projet. Donnée non disponible en 2024",
        ],
        error_indicateur_list: ["Consommation énergétique avant travaux"],
      },
      ["Vérifier le périmètre de calcul", "Libellé partenaire conservé"],
    ),
  );
  await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);
  const signals = page.getByRole("region", {
    name: "Données à vérifier",
    exact: true,
  });
  await expect(
    signals.getByLabel("4 indicateurs signalés", { exact: true }),
  ).toBeVisible();
  await expect(
    signals
      .getByRole("list", { name: "Indicateurs signalés" })
      .getByRole("listitem"),
  ).toHaveCount(4);

  const consumption = signals.getByRole("region", {
    name: "Consommation énergétique avant travaux",
    exact: true,
  });
  await expect(
    consumption.getByText("Anomalie statistique", { exact: true }),
  ).toBeVisible();
  await expect(
    consumption.getByText("Incohérence forte", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByRole("heading", {
      name: "Gain énergétique estimé (en %)",
      exact: true,
    }),
  ).toBeVisible();

  const unknown = signals.getByRole("region", {
    name: "Indicateur composite inconnu, à conserver",
    exact: true,
  });
  await expect(
    unknown.getByText(
      "Aucune valeur modifiable n’est disponible pour ce signalement.",
      { exact: true },
    ),
  ).toBeVisible();
  const absentValue = signals.getByRole("region", {
    name: "Surface du batiment après le projet. Donnée non disponible en 2024",
    exact: true,
  });
  await expect(
    absentValue.getByText(
      "Aucune valeur modifiable n’est disponible pour ce signalement.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    signals.getByText("Démarche complémentaire", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByText("Vérifier le périmètre de calcul", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByText("Libellé partenaire conservé", { exact: true }),
  ).toBeVisible();
  await expect(signals.getByTestId("impact-section")).toHaveCount(0);
  await expect(page.getByTestId("impact-section")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 3, name: "Énergie", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 4,
      name: "Consommation énergétique",
      exact: true,
    }),
  ).toBeVisible();
});

test("une réponse complète sans signalement reste distincte des avertissements", async ({
  page,
  msw,
}, testInfo) => {
  msw.use(fondsVertResponse(noAnomalies, ["Contrôler les pièces sources"]));
  await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);
  const signals = page.getByRole("region", {
    name: "Données à vérifier",
    exact: true,
  });
  await expect(
    signals.getByText("Aucun signalement", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByRole("heading", {
      name: "Avertissements Fonds vert",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    signals.getByText("Contrôler les pièces sources", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByRole("list", { name: "Indicateurs signalés" }),
  ).toHaveCount(0);
});

for (const [situation, anomalies, expectedState, hasLabel] of [
  ["absente", undefined, "Signalements non renseignés", false],
  ["nulle", null, "Signalements non renseignés", false],
  [
    "partielle",
    {
      est_anomalie: true,
      anomalie_indicateur_list: ["Indicateur partenaire à conserver"],
    },
    "Les signalements reçus sont incomplets. Les informations disponibles restent affichées.",
    true,
  ],
  [
    "invalide",
    {
      ...noAnomalies,
      est_anomalie: "oui",
      anomalie_indicateur_list: ["Indicateur partenaire à conserver"],
    },
    "Les signalements reçus sont incomplets. Les informations disponibles restent affichées.",
    true,
  ],
] as const) {
  test(`une réponse ${situation} ne devient pas une absence de signalement`, async ({
    page,
    msw,
  }, testInfo) => {
    msw.use(fondsVertResponse(anomalies));
    await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);
    const signals = page.getByRole("region", {
      name: "Données à vérifier",
      exact: true,
    });
    await expect(
      signals.getByText("Aucun signalement", { exact: true }),
    ).toHaveCount(0);
    await expect(
      signals.getByLabel("0 indicateurs signalés", { exact: true }),
    ).toHaveCount(0);
    if (hasLabel) {
      await expect(
        signals.getByRole("heading", {
          name: "Indicateur partenaire à conserver",
          exact: true,
        }),
      ).toBeVisible();
    }
    await expect(
      signals.getByText(expectedState, { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("impact-section")).toBeVisible();
  });
}

test("un signalement global sans indicateur reste visible sans compteur trompeur", async ({
  page,
  msw,
}, testInfo) => {
  msw.use(
    fondsVertResponse({
      ...noAnomalies,
      est_error: true,
      anomalie_demarche_list: ["Démarche signalée"],
    }),
  );
  await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);
  const signals = page.getByRole("region", {
    name: "Données à vérifier",
    exact: true,
  });
  await expect(
    signals.getByText("Signalement à préciser", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByText("Incohérence forte sans indicateur précisé.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    signals.getByText("Démarche signalée", { exact: true }),
  ).toBeVisible();
  await expect(
    signals.getByText("Aucun signalement", { exact: true }),
  ).toHaveCount(0);
});

test("une panne Fonds vert garde les métriques locales et un état indisponible sans double alerte", async ({
  page,
  msw,
}, testInfo) => {
  const dossierNumber = 89330260 + testInfo.parallelIndex;
  await importStoredDossierMetricsIfMissing({ dossierNumber, metrics });
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () =>
      HttpResponse.json({ error: "Source indisponible" }, { status: 503 }),
    ),
  );
  await page.goto(`/projets/${dossierNumber}/impact`);
  const signals = page.getByRole("region", {
    name: "Données à vérifier",
    exact: true,
  });
  await expect(
    signals.getByText("Signalements indisponibles", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".fr-alert")).toHaveCount(1);
  await expect(signals.getByRole("alert")).toContainText(
    "Les valeurs déjà enregistrées restent consultables.",
  );
  await expect(
    signals.getByText("Aucun signalement", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("impact-section")).toContainText(/100\s*kWh/);
});
