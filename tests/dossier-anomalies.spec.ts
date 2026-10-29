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
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
  importStoredDossierMetricsIfMissing,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const PORTEUR = "porteur.signalements@example.com";
const INSTRUCTEUR = "instructeur.signalements@example.com";
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
  gain_energetique_estime_percentage: {
    label: "Gain énergétique estimé",
    unite: "%",
    valeur_estimee: 30,
  },
};

function fondsVertResponse(
  anomalies: unknown,
  avertissements: unknown = [],
  sourceMetrics: unknown = metrics,
) {
  return http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () =>
    HttpResponse.json({
      data: {
        ...fondsVertDossierData.data,
        information_financiere: { informations_engagement: [] },
        metrique_specifique: sourceMetrics,
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
      .getByRole("region"),
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

test("un ratio ne propose que sa valeur source disponible", async ({
  page,
  msw,
}, testInfo) => {
  msw.use(
    fondsVertResponse(
      {
        ...noAnomalies,
        est_anomalie: true,
        anomalie_indicateur_list: ["Gain énergétique estimé (en %)"],
      },
      [],
      { ...metrics, conso_energetique_apres_travaux: null },
    ),
  );
  await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);
  const ratio = page.getByRole("region", {
    name: "Gain énergétique estimé (en %)",
    exact: true,
  });
  await expect(ratio.getByRole("link")).toHaveCount(1);
  await expect(
    ratio.getByRole("link", {
      name: "Vérifier Consommation énergétique après travaux",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    ratio.getByText("Certaines valeurs sources ne sont pas disponibles.", {
      exact: true,
    }),
  ).toBeVisible();
  await ratio
    .getByRole("link", {
      name: "Vérifier Consommation énergétique avant travaux",
      exact: true,
    })
    .press("Enter");
  await expect(
    page
      .getByTestId("impact-section")
      .getByRole("region", {
        name: "Consommation énergétique avant travaux",
        exact: true,
      })
      .getByRole("button", { name: "Modifier", exact: true }),
  ).toBeFocused();
});

for (const [actor, email, correctedValue] of [
  ["porteur", PORTEUR, 60],
  ["instructeur", INSTRUCTEUR, 65],
] as const) {
  test(`${actor === "porteur" ? "le porteur" : "l’instructeur"} corrige la source d’un ratio depuis son signalement et garde le signalement jusqu’à une nouvelle réponse FV`, async ({
    page,
    msw,
  }, testInfo) => {
    const dossierNumber = 89330260 + testInfo.parallelIndex;
    const sourceCode = "conso_energetique_apres_travaux";
    const sourceLabel = "Consommation énergétique après travaux";
    let responseState: "initial" | "recalculated" | "unavailable" = "initial";
    msw.use(
      http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () => {
        if (responseState === "unavailable")
          return HttpResponse.json(
            { error: "Source indisponible" },
            { status: 503 },
          );
        return HttpResponse.json({
          data: {
            ...fondsVertDossierData.data,
            information_financiere: { informations_engagement: [] },
            metrique_specifique: metrics,
            anomalies:
              responseState === "recalculated"
                ? noAnomalies
                : {
                    ...noAnomalies,
                    est_anomalie: true,
                    anomalie_indicateur_list: [
                      "Gain énergétique estimé (en %)",
                      "Signalement partenaire sans correspondance",
                    ],
                  },
            avertissements: [],
          },
        });
      }),
    );
    await authenticatePage(page, { email });
    if (actor === "instructeur")
      await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projets/${dossierNumber}/impact`);

    const signals = page.getByRole("region", {
      name: "Données à vérifier",
      exact: true,
    });
    const ratio = signals.getByRole("region", {
      name: "Gain énergétique estimé (en %)",
      exact: true,
    });
    await expect(
      signals.getByLabel("2 indicateurs signalés", { exact: true }),
    ).toBeVisible();
    await expect(ratio.getByRole("link")).toHaveCount(2);
    await expect(
      ratio.getByRole("link", {
        name: "Vérifier Gain énergétique estimé",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      signals
        .getByRole("region", {
          name: "Signalement partenaire sans correspondance",
          exact: true,
        })
        .getByRole("link"),
    ).toHaveCount(0);

    const values = page.getByTestId("impact-section");
    const energy = values.getByRole("region", {
      name: "Consommation énergétique",
      exact: true,
    });
    const after = energy.getByRole("group", {
      name: "Après travaux",
      exact: true,
    });
    const opener = after.getByRole("button", { name: "Modifier", exact: true });
    await expect(
      values.getByRole("button", { name: "Modifier", exact: true }),
    ).toHaveCount(3);
    await expect(
      energy
        .getByRole("group", { name: "Gain énergétique estimé", exact: true })
        .getByRole("button", { name: "Modifier", exact: true }),
    ).toBeEnabled();

    const sourceLink = ratio.getByRole("link", {
      name: `Vérifier ${sourceLabel}`,
      exact: true,
    });
    for (const closeAction of ["Annuler", "Fermer", "Échap"] as const) {
      await sourceLink.press("Enter");
      await expect(opener).toBeFocused();
      await opener.press("Enter");
      const openedDialog = page.getByRole("dialog", {
        name: "Modifier la valeur",
        exact: true,
      });
      await openedDialog.getByLabel(sourceLabel).fill("55");
      if (closeAction === "Échap") {
        await openedDialog
          .getByRole("button", { name: "Enregistrer", exact: true })
          .press("Escape");
      } else {
        await openedDialog
          .getByRole("button", { name: closeAction, exact: true })
          .press("Enter");
      }
      await expect(openedDialog).toBeHidden();
      await expect(opener).toBeFocused();
      await expect(after.getByTestId("valeur-1")).toHaveText("70kWh");
    }

    await sourceLink.press("Enter");
    await expect(opener).toBeFocused();
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Modifier la valeur",
      exact: true,
    });
    await expect(dialog.getByLabel(sourceLabel)).toBeFocused();
    await expect(
      dialog.getByText("Unité : kWh", { exact: true }),
    ).toBeVisible();
    await dialog.getByLabel(sourceLabel).fill(String(correctedValue));
    const saved = page.waitForResponse((response) =>
      response
        .url()
        .endsWith(`/api/projets/${dossierNumber}/metrics/${sourceCode}`),
    );
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    expect((await saved).status()).toBe(200);
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(after.getByTestId("valeur-1")).toHaveText(
      `${correctedValue}kWh`,
    );
    await expect(
      signals.getByLabel("2 indicateurs signalés", { exact: true }),
    ).toBeVisible();
    await expect(signals.getByRole("note")).toHaveText(
      "Des corrections sont enregistrées localement. Le recalcul des signalements par Fonds vert est différé.",
    );

    const sql = createTestDatabaseClient();
    try {
      const revisions =
        await sql`select revision,number_value,author_email,created_at from dossier_metric_revisions where dossier_number=${dossierNumber} and metric_code=${sourceCode} order by revision`;
      expect(
        revisions.map((revision) => ({
          revision: revision.revision,
          value: Number(revision.number_value),
          email: revision.author_email,
          date: revision.created_at,
        })),
      ).toEqual([
        { revision: 1, value: 70, email: null, date: expect.any(Date) },
        { revision: 2, value: correctedValue, email, date: expect.any(Date) },
      ]);
    } finally {
      await sql.end();
    }

    await page.reload();
    await expect(after.getByTestId("valeur-1")).toHaveText(
      `${correctedValue}kWh`,
    );
    await expect(
      signals.getByLabel("2 indicateurs signalés", { exact: true }),
    ).toBeVisible();
    await expect(signals.getByRole("note")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    responseState = "recalculated";
    await page.reload();
    await expect(
      signals.getByText("Aucun signalement", { exact: true }),
    ).toBeVisible();
    await expect(signals.getByRole("note")).toHaveCount(0);
    await expect(after.getByTestId("valeur-1")).toHaveText(
      `${correctedValue}kWh`,
    );

    responseState = "unavailable";
    await page.reload();
    await expect(
      signals.getByText("Signalements indisponibles", { exact: true }),
    ).toBeVisible();
    await expect(
      signals.getByText("Aucun signalement", { exact: true }),
    ).toHaveCount(0);
    await expect(after.getByTestId("valeur-1")).toHaveText(
      `${correctedValue}kWh`,
    );
  });
}
