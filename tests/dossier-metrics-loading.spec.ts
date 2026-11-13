import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { makeDossierDataWithNumber } from "./fixtures/ds";
import { fondsVertDossierData } from "./fixtures/fondsvert";
import {
  deleteStoredDossierMetrics,
  getStoredDossierMetrics,
  importStoredDossierMetricsIfMissing,
} from "./setup/db";
import { configureAdministratorDossierFixtures } from "./setup/dossier";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const DOSSIER_NUMBER = 89334003;
configureAdministratorDossierFixtures(DOSSIER_NUMBER);

test("dossier page displays impact metrics correctly", async ({ page }) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/impact`);

  // Métriques avant/après travaux, chacune sur sa ligne

  for (const [testId, label, value] of [
    [
      "metric-consommation-energetique-avant-travaux",
      "Consommation énergétique avant travaux",
      "205 565",
    ],
    [
      "metric-consommation-energetique-apres-travaux",
      "Consommation énergétique après travaux",
      "1 935 960",
    ],
    [
      "metric-emissions-de-ges-avant-travaux",
      "Émissions de GES avant travaux",
      "-448",
    ],
  ]) {
    const row = page.getByTestId(testId);
    await expect(row).toContainText(label);
    await expect(row.getByTestId("valeur-estimee")).toContainText(value);
  }

  // Métriques simples

  const gainEnergetique = page.getByTestId("metric-gain-energetique-estime");
  await expect(gainEnergetique).toContainText("Gain énergétique estimé");
  await expect(gainEnergetique.getByTestId("valeur-estimee")).toContainText(
    "32%",
  );

  // Métriques de type Array

  const natureOperations = page.getByTestId("metric-nature-des-operations");
  await expect(natureOperations).toContainText("Nature des opérations");

  const natureOperationsTags = natureOperations
    .getByRole("list")
    .getByRole("listitem");
  await expect(natureOperationsTags).toHaveCount(3);
  await expect(natureOperationsTags.nth(0)).toContainText(
    "Travaux d'isolation de l'enveloppe du ou des bâtiments",
  );
  await expect(natureOperationsTags.nth(1)).toContainText(
    "Travaux de rénovation énergétique",
  );
  await expect(natureOperationsTags.nth(2)).toContainText(
    "Travaux de mise en conformité",
  );

  const typeBatiments = page.getByTestId("metric-types-des-batiments");
  await expect(typeBatiments).toContainText("Types des bâtiments");

  const typeBatimentsTags = typeBatiments
    .getByRole("list")
    .getByRole("listitem");
  await expect(typeBatimentsTags).toHaveCount(2);
  await expect(typeBatimentsTags.nth(0)).toContainText(
    "École (établissement public du premier degré)",
  );
  await expect(typeBatimentsTags.nth(1)).toContainText(
    "Établissement public du second degré",
  );

  await expect(
    page.getByRole("link", { name: "Mettre à jour les données" }),
  ).toHaveCount(0);
});

test("dossier page displays stored metrics before Fonds Vert API metrics", async ({
  page,
  msw,
}) => {
  const storedMetricsDossierNumber = 89000001;
  const includeMetricsRequests: Array<string | null> = [];

  await deleteStoredDossierMetrics(storedMetricsDossierNumber);
  await importStoredDossierMetricsIfMissing({
    dossierNumber: storedMetricsDossierNumber,
    metrics: {
      stored_metric: {
        label: "Métrique stockée en base",
        unite: "ha",
        valeur_estimee: 42,
      },
    },
  });

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(storedMetricsDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${storedMetricsDossierNumber}`,
      ({ request }) => {
        includeMetricsRequests.push(
          new URL(request.url).searchParams.get("include_metrics"),
        );
        return HttpResponse.json({
          data: {
            socle_commun: fondsVertDossierData.data.socle_commun,
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            metrique_specifique: {
              api_metric: {
                label: "Métrique Fonds Vert API",
                unite: "m²",
                valeur_estimee: 99,
              },
            },
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${storedMetricsDossierNumber}/impact`);

    const impactSection = page.getByTestId("impact-section");
    await expect(impactSection).toBeVisible();

    const storedMetric = impactSection.getByTestId(
      "metric-metrique-stockee-en-base",
    );
    await expect(storedMetric).toBeVisible();
    await expect(storedMetric.getByTestId("valeur-estimee")).toContainText(
      "42ha",
    );

    await expect(
      impactSection.getByTestId("metric-metrique-fonds-vert-api"),
    ).not.toBeAttached();
    expect(includeMetricsRequests).toEqual(["false"]);
    await page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Financement", exact: true })
      .click();
    await expect(
      page.getByLabel("Montant total des dépenses du projet"),
    ).toContainText("18 939 933,00 €");

    await expect
      .poll(() => getStoredDossierMetrics(storedMetricsDossierNumber))
      .toMatchObject({
        stored_metric: {
          label: "Métrique stockée en base",
          unite: "ha",
          valeur_estimee: 42,
        },
      });
  } finally {
    await deleteStoredDossierMetrics(storedMetricsDossierNumber);
  }
});

test("dossier page stores Fonds Vert API metrics when no stored metrics exist", async ({
  page,
  msw,
}) => {
  const apiMetricsDossierNumber = 89000002;
  const includeMetricsRequests: Array<string | null> = [];

  await deleteStoredDossierMetrics(apiMetricsDossierNumber);

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(apiMetricsDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${apiMetricsDossierNumber}`,
      ({ request }) => {
        const includeMetrics = new URL(request.url).searchParams.get(
          "include_metrics",
        );
        includeMetricsRequests.push(includeMetrics);

        return HttpResponse.json({
          data: {
            socle_commun: fondsVertDossierData.data.socle_commun,
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            metrique_specifique: {
              [includeMetrics === "true"
                ? "api_created_metric"
                : "remote_replacement"]: {
                label:
                  includeMetrics === "true"
                    ? "Métrique créée depuis Fonds Vert"
                    : "Remplacement distant",
                unite: "m²",
                valeur_estimee: includeMetrics === "true" ? 99 : 999,
              },
            },
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${apiMetricsDossierNumber}/impact`);

    const apiMetric = page
      .getByTestId("impact-section")
      .getByTestId("metric-metrique-creee-depuis-fonds-vert");
    await expect(apiMetric).toBeVisible();

    await expect
      .poll(() => getStoredDossierMetrics(apiMetricsDossierNumber))
      .toMatchObject({
        api_created_metric: {
          label: "Métrique créée depuis Fonds Vert",
          unite: "m²",
          valeur_estimee: 99,
        },
      });

    await page.reload();

    await expect(apiMetric).toBeVisible();
    await expect(
      page.getByText("Remplacement distant", { exact: true }),
    ).not.toBeAttached();
    expect(includeMetricsRequests).toEqual(["true", "false"]);
  } finally {
    await deleteStoredDossierMetrics(apiMetricsDossierNumber);
  }
});

test("dossier page retries an empty metric import on the next load", async ({
  page,
  msw,
}) => {
  const emptyMetricsDossierNumber = 89000006;
  const includeMetricsRequests: Array<string | null> = [];

  await deleteStoredDossierMetrics(emptyMetricsDossierNumber);

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(emptyMetricsDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${emptyMetricsDossierNumber}`,
      ({ request }) => {
        const includeMetrics = new URL(request.url).searchParams.get(
          "include_metrics",
        );
        includeMetricsRequests.push(includeMetrics);

        return HttpResponse.json({
          data: {
            socle_commun: fondsVertDossierData.data.socle_commun,
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            metrique_specifique: {},
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${emptyMetricsDossierNumber}/impact`);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Données d’impact",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Aucune donnée d’impact n’est disponible pour ce projet.",
        { exact: true },
      ),
    ).toBeVisible();

    await expect
      .poll(() => getStoredDossierMetrics(emptyMetricsDossierNumber))
      .toBeUndefined();

    await page.reload();

    expect(
      await getStoredDossierMetrics(emptyMetricsDossierNumber),
    ).toBeUndefined();
    expect(includeMetricsRequests).toEqual(["true", "true"]);
  } finally {
    await deleteStoredDossierMetrics(emptyMetricsDossierNumber);
  }
});

test("la page Impact conserve les valeurs locales quand Fonds vert est indisponible", async ({
  page,
  msw,
}) => {
  const dossierNumber = 89000034;
  await deleteStoredDossierMetrics(dossierNumber);
  await importStoredDossierMetricsIfMissing({
    dossierNumber,
    metrics: {
      stored_metric: {
        label: "Surface conservée localement",
        unite: "ha",
        valeur_estimee: 42,
      },
    },
  });
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json(makeDossierDataWithNumber(dossierNumber)),
    ),
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${dossierNumber}`, () =>
      HttpResponse.json({ error: "FV indisponible" }, { status: 503 }),
    ),
  );
  try {
    await page.goto(`/projets/${dossierNumber}/impact`);
    await expect(
      page
        .getByTestId("impact-section")
        .getByRole("region", { name: "Surface conservée localement" })
        .getByLabel("Valeur effective"),
    ).toHaveText("42ha");
    await expect(
      page.getByRole("alert").filter({
        hasText: "Les données Fonds vert sont temporairement indisponibles.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Modifier la valeur «/ }),
    ).toBeEnabled();
    await expect(
      page
        .getByRole("navigation", { name: "Pages du projet" })
        .getByRole("link", { name: "Financement", exact: true }),
    ).toBeVisible();
    expect(
      (await getStoredDossierMetrics(dossierNumber))?.stored_metric
        .valeur_estimee,
    ).toBe(42);
  } finally {
    await deleteStoredDossierMetrics(dossierNumber);
  }
});

test("dossier page retries when Fonds Vert only returns unavailable metrics", async ({
  page,
  msw,
}) => {
  const unavailableMetricsDossierNumber = 89000007;
  const includeMetricsRequests: Array<string | null> = [];

  await deleteStoredDossierMetrics(unavailableMetricsDossierNumber);

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(unavailableMetricsDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${unavailableMetricsDossierNumber}`,
      ({ request }) => {
        const includeMetrics = new URL(request.url).searchParams.get(
          "include_metrics",
        );
        includeMetricsRequests.push(includeMetrics);

        return HttpResponse.json({
          data: {
            socle_commun: fondsVertDossierData.data.socle_commun,
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            metrique_specifique: {
              unavailable: {
                label: "Surface créée — Donnée non disponible",
                unite: "m²",
                valeur_estimee: 12,
              },
            },
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${unavailableMetricsDossierNumber}/impact`);

    await expect
      .poll(() => getStoredDossierMetrics(unavailableMetricsDossierNumber))
      .toBeUndefined();

    await page.reload();

    expect(
      await getStoredDossierMetrics(unavailableMetricsDossierNumber),
    ).toBeUndefined();
    expect(includeMetricsRequests).toEqual(["true", "true"]);
  } finally {
    await deleteStoredDossierMetrics(unavailableMetricsDossierNumber);
  }
});

test("dossier page organizes metrics by thematic groups correctly", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/impact`);

  // 1- Vérification des titres de chaque groupe de métriques

  await expect(page.getByTestId("metric-group-title-energy")).toHaveText(
    "Énergie",
  );

  await expect(page.getByTestId("metric-group-title-ges")).toHaveText(
    "Gaz à Effet de Serre (GES)",
  );

  await expect(page.getByTestId("metric-group-title-project")).toHaveText(
    "Caractéristiques du projet",
  );

  await expect(
    page.getByTestId("metric-group-title-proximity-management"),
  ).toHaveText("Gestion de proximité");

  await expect(
    page.getByTestId("metric-group-title-separate-collection"),
  ).toHaveText("Collecte séparée");

  // 2- Vérification du contenu de chaque groupe

  const projectSection = page.getByTestId("metric-group-project");

  await expect(
    projectSection.getByTestId("metric-surface-du-batiment-avant-projet"),
  ).toBeVisible();

  await expect(
    projectSection.getByTestId("metric-type-de-surface"),
  ).toBeVisible();

  const energieSection = page.getByTestId("metric-group-energy");

  await expect(
    energieSection.getByTestId("metric-systeme-de-chauffage-avant-travaux"),
  ).toBeVisible();

  const proxSection = page.getByTestId("metric-group-proximity-management");

  await expect(
    proxSection.getByTestId(
      "metric-nombre-d-habitants-pratiquant-la-gestion-de-proximite",
    ),
  ).toBeVisible();

  await expect(
    proxSection.getByTestId(
      "metric-tonnage-annuel-entrant-pour-la-gestion-de-proximite",
    ),
  ).toBeVisible();

  const collecteSection = page.getByTestId("metric-group-separate-collection");

  await expect(
    collecteSection.getByTestId(
      "metric-nombre-d-habitants-concernes-par-la-collecte-separee",
    ),
  ).toBeVisible();

  await expect(
    collecteSection.getByTestId(
      "metric-quantite-annuelle-globale-de-biodechets-collectes",
    ),
  ).toBeVisible();
});

test("dossier page handles 422 error with retry without metrics and impact", async ({
  page,
  msw,
}) => {
  const retryWithoutMetricsDossierNumber = 89000005;
  const includeMetricsRequests: Array<string | null> = [];
  let metricsAttemptCount = 0;

  await deleteStoredDossierMetrics(retryWithoutMetricsDossierNumber);

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(retryWithoutMetricsDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${retryWithoutMetricsDossierNumber}`,
      ({ request }) => {
        const url = new URL(request.url);
        const includeMetrics = url.searchParams.get("include_metrics");

        includeMetricsRequests.push(includeMetrics);

        if (includeMetrics === "true") {
          metricsAttemptCount++;
          if (metricsAttemptCount === 1) {
            return HttpResponse.json(
              { error: "Unprocessable Entity" },
              { status: 422 },
            );
          }

          return HttpResponse.json({
            data: {
              information_financiere:
                fondsVertDossierData.data.information_financiere,
              socle_commun: fondsVertDossierData.data.socle_commun,
              metrique_specifique: {
                retry_metric: {
                  label: "Métrique chargée au nouvel essai",
                  unite: null,
                  valeur_estimee: 7,
                },
              },
            },
          });
        }

        return HttpResponse.json({
          data: {
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            socle_commun: fondsVertDossierData.data.socle_commun,
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${retryWithoutMetricsDossierNumber}/financement`);

    const aideFondsVert = page.getByRole("region", {
      name: "Aide du Fonds vert",
    });
    await expect(aideFondsVert.getByLabel("Montant attribué")).toContainText(
      "10 073 564,00 €",
    );

    const engagementJuridique = page.getByRole("region", {
      name: "Engagement juridique n°2105212345",
    });
    await expect(
      engagementJuridique.getByLabel("Montant attribué initial", {
        exact: true,
      }),
    ).toContainText("10 073 574,00 €");

    const impactSection = page.getByTestId("impact-section");
    await expect(impactSection).not.toBeAttached();

    expect(includeMetricsRequests).toEqual(["true", "false"]);
    expect(
      await getStoredDossierMetrics(retryWithoutMetricsDossierNumber),
    ).toBeUndefined();

    await page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Données d’impact", exact: true })
      .click();

    await expect(
      page.getByRole("region", {
        name: "Métrique chargée au nouvel essai",
      }),
    ).toBeVisible();
    expect(includeMetricsRequests).toEqual(["true", "false", "true"]);
    await expect
      .poll(() => getStoredDossierMetrics(retryWithoutMetricsDossierNumber))
      .toMatchObject({
        retry_metric: {
          label: "Métrique chargée au nouvel essai",
          valeur_estimee: 7,
        },
      });
  } finally {
    await deleteStoredDossierMetrics(retryWithoutMetricsDossierNumber);
  }
});

test("dossier page filters out metrics with 'Donnée non disponible' in label", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/impact`);

  await expect(
    page.getByTestId("metric-surface-du-batiment-avant-projet"),
  ).toBeVisible();

  await expect(
    page.getByTestId(
      "metric-surface-du-batiment-apres-le-projet-donnee-non-disponible-en-2024",
    ),
  ).not.toBeAttached();

  await expect(
    page.getByTestId(
      "metric-le-projet-modifie-t-il-la-surfaces-des-batiments-concernes-donnee-non-disponible-en-2024",
    ),
  ).not.toBeAttached();
});

test("dossier page displays metrics", async ({ page, msw }) => {
  const metricsDossierNumber = 89000003;

  await deleteStoredDossierMetrics(metricsDossierNumber);

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(makeDossierDataWithNumber(metricsDossierNumber));
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${metricsDossierNumber}`,
      () => {
        return HttpResponse.json({
          data: {
            socle_commun: fondsVertDossierData.data.socle_commun,
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            metrique_specifique: {
              nombre_logements_sociaux: {
                label: "Nb de logements sociaux sur les secteurs de friches",
                unite: null,
                valeur_estimee: 25,
              },
              emprise_fonciere_friche: {
                label: "Emprise foncière des secteurs en friche",
                unite: "ha",
                valeur_estimee: 2441,
              },
              natures_friche: {
                label: "Nature de la friche",
                unite: null,
                valeur_estimee: [
                  "Friche commerciale",
                  "Friche urbaine – îlots anciens dégradés",
                ],
              },
              activite_bureaux_surface: {
                label: "Activités de bureaux - Surface de plancher",
                unite: "m²",
                valeur_estimee: null,
              },
            },
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${metricsDossierNumber}/impact`);

    const impactSection = page.getByTestId("impact-section");
    await expect(impactSection).toBeVisible();

    const logements = impactSection.getByTestId(
      "metric-nb-de-logements-sociaux-sur-les-secteurs-de-friches",
    );
    await expect(logements).toBeVisible();
    await expect(logements.getByTestId("valeur-estimee")).toContainText("25");

    const emprise = impactSection.getByTestId(
      "metric-emprise-fonciere-des-secteurs-en-friche",
    );
    await expect(emprise).toBeVisible();
    await expect(emprise.getByTestId("valeur-estimee")).toContainText("2 441");

    const natures = impactSection.getByTestId("metric-nature-de-la-friche");
    await expect(natures).toBeVisible();
    const tags = natures.getByRole("list").getByRole("listitem");
    await expect(tags).toHaveCount(2);
    await expect(tags.nth(0)).toContainText("Friche commerciale");

    await expect(
      impactSection.getByTestId(
        "metric-activites-de-bureaux---surface-de-plancher",
      ),
    ).not.toBeAttached();
  } finally {
    await deleteStoredDossierMetrics(metricsDossierNumber);
  }
});

test("dossier page displays boolean metric as Oui/Non", async ({
  page,
  msw,
}) => {
  const booleanMetricDossierNumber = 89000004;

  await deleteStoredDossierMetrics(booleanMetricDossierNumber);

  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(booleanMetricDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${booleanMetricDossierNumber}`,
      () => {
        return HttpResponse.json({
          data: {
            socle_commun: fondsVertDossierData.data.socle_commun,
            information_financiere:
              fondsVertDossierData.data.information_financiere,
            metrique_specifique: {
              sol_eau_pollues: {
                label:
                  "Les sols et eaux souterraines de la friche sont-ils pollués ?",
                unite: null,
                valeur_estimee: false,
              },
            },
          },
        });
      },
    ),
  );

  try {
    await page.goto(`/projets/${booleanMetricDossierNumber}/impact`);

    const impactSection = page.getByTestId("impact-section");
    await expect(impactSection).toBeVisible();

    const solPollue = impactSection.getByTestId(
      "metric-les-sols-et-eaux-souterraines-de-la-friche-sont-ils-pollues",
    );
    await expect(solPollue).toBeVisible();
    await expect(solPollue.getByTestId("valeur-estimee")).toContainText("Non");
  } finally {
    await deleteStoredDossierMetrics(booleanMetricDossierNumber);
  }
});
