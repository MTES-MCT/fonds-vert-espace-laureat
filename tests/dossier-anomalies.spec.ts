import {
  expect,
  graphql,
  http,
  HttpResponse,
  type Page,
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

function impactValues(page: Page) {
  return page.getByTestId("impact-section");
}

function valueRow(page: Page, label: string) {
  return impactValues(page).getByRole("region", { name: label, exact: true });
}

function otherSignals(page: Page) {
  return page.getByRole("region", {
    name: "Signalements Fonds vert",
    exact: true,
  });
}

function impactTab(page: Page) {
  return page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true });
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

test("la page Impact affiche chaque signalement sur sa valeur et regroupe ceux sans valeur avec le contexte et les avertissements", async ({
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

  await expect(impactTab(page)).toHaveAccessibleDescription(
    "4 données à vérifier",
  );

  await expect(
    valueRow(page, "Consommation énergétique avant travaux").getByRole("note", {
      name: "Anomalie détectée",
    }),
  ).toHaveText("Erreur");
  await expect(
    valueRow(page, "Consommation énergétique après travaux").getByRole("note", {
      name: "Anomalie détectée",
    }),
  ).toHaveCount(0);
  await expect(
    valueRow(page, "Gain énergétique estimé").getByRole("note", {
      name: "Anomalie détectée",
    }),
  ).toHaveText("Anomalie");

  const others = otherSignals(page);
  await expect(
    others
      .getByRole("list", { name: "Signalements sans valeur affichée" })
      .getByRole("listitem"),
  ).toHaveText([
    /Indicateur composite inconnu, à conserver/,
    /Surface du batiment après le projet\. Donnée non disponible en 2024/,
  ]);
  await expect(others).not.toContainText(
    "Consommation énergétique avant travaux",
  );
  await expect(
    others.getByText("Démarche complémentaire", { exact: true }),
  ).toBeVisible();
  await expect(
    others.getByText("Vérifier le périmètre de calcul", { exact: true }),
  ).toBeVisible();
  await expect(
    others.getByText("Libellé partenaire conservé", { exact: true }),
  ).toBeVisible();
});

test("une réponse complète sans signalement n’affiche que ses avertissements", async ({
  page,
  msw,
}, testInfo) => {
  msw.use(fondsVertResponse(noAnomalies, ["Contrôler les pièces sources"]));
  await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);

  const others = otherSignals(page);
  await expect(
    others.getByRole("heading", {
      name: "Avertissements Fonds vert",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    others.getByText("Contrôler les pièces sources", { exact: true }),
  ).toBeVisible();
  await expect(
    others.getByRole("list", { name: "Signalements sans valeur affichée" }),
  ).toHaveCount(0);

  await expect(
    impactValues(page).getByRole("note", { name: "Anomalie détectée" }),
  ).toHaveCount(0);
  await expect(impactTab(page)).not.toHaveAttribute("aria-describedby");
});

for (const [situation, anomalies, expectedState, hasLabel] of [
  [
    "absente",
    undefined,
    "Fonds vert n’a pas renseigné les signalements de ce projet.",
    false,
  ],
  [
    "nulle",
    null,
    "Fonds vert n’a pas renseigné les signalements de ce projet.",
    false,
  ],
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
  test(`une réponse ${situation} est expliquée sans devenir une absence de signalement`, async ({
    page,
    msw,
  }, testInfo) => {
    msw.use(fondsVertResponse(anomalies));
    await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);

    const others = otherSignals(page);
    await expect(
      others.getByText(expectedState, { exact: true }),
    ).toBeVisible();
    if (hasLabel) {
      await expect(
        others.getByText("Indicateur partenaire à conserver", { exact: true }),
      ).toBeVisible();
    }
    await expect(impactValues(page)).toBeVisible();
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

  const others = otherSignals(page);
  await expect(
    others.getByText("Erreur sans indicateur précisé.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    others.getByText("Démarche signalée", { exact: true }),
  ).toBeVisible();
});

test("une panne Fonds vert garde les métriques locales et une seule alerte", async ({
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

  await expect(page.locator(".fr-alert")).toHaveCount(1);
  await expect(page.locator(".fr-alert")).toContainText(
    "Les valeurs déjà enregistrées restent consultables.",
  );
  await expect(otherSignals(page)).toHaveCount(0);
  await expect(impactValues(page)).toContainText(/100\s*kWh/);
});

test("un ratio signalé apparaît une seule fois, sur sa propre valeur", async ({
  page,
  msw,
}, testInfo) => {
  msw.use(
    fondsVertResponse({
      ...noAnomalies,
      est_anomalie: true,
      anomalie_indicateur_list: ["Gain énergétique estimé (en %)"],
    }),
  );
  await page.goto(`/projets/${89330260 + testInfo.parallelIndex}/impact`);

  const notes = impactValues(page).getByRole("note", {
    name: "Anomalie détectée",
  });
  await expect(notes).toHaveCount(1);
  await expect(
    valueRow(page, "Gain énergétique estimé").getByRole("note", {
      name: "Anomalie détectée",
    }),
  ).toHaveText("Anomalie");
  await expect(otherSignals(page)).toHaveCount(0);
});

for (const [actor, email, correctedValue] of [
  ["porteur", PORTEUR, 25],
  ["instructeur", INSTRUCTEUR, 28],
] as const) {
  test(`${actor === "porteur" ? "le porteur" : "l’instructeur"} corrige un ratio signalé sur sa ligne et garde le signalement jusqu’à une nouvelle réponse FV`, async ({
    page,
    msw,
  }, testInfo) => {
    const dossierNumber = 89330260 + testInfo.parallelIndex;
    const sourceCode = "gain_energetique_estime_percentage";
    const sourceLabel = "Gain énergétique estimé";
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

    await expect(impactTab(page)).toHaveAccessibleDescription(
      "2 données à vérifier",
    );
    await expect(
      otherSignals(page).getByText(
        "Signalement partenaire sans correspondance",
        { exact: true },
      ),
    ).toBeVisible();

    const values = impactValues(page);
    const gain = valueRow(page, "Gain énergétique estimé");
    const opener = gain.getByRole("button", { name: /^Modifier la valeur «/ });
    const gainNotes = gain.getByRole("note", { name: "Anomalie détectée" });
    const pendingAnalysis = gain.getByText("En attente d’analyse", {
      exact: true,
    });
    await expect(gainNotes).toHaveText("Anomalie");
    await expect(pendingAnalysis).toHaveCount(0);
    await expect(
      values.getByRole("button", { name: /^Modifier la valeur «/ }),
    ).toHaveCount(3);

    await page.waitForSelector('[data-fr-js-modal-button="true"]', {
      state: "attached",
    });
    for (const closeAction of ["Annuler", "Fermer", "Échap"] as const) {
      await opener.focus();
      await opener.press("Enter");
      const openedDialog = page.getByRole("dialog", {
        name: "Modifier la valeur",
        exact: true,
      });
      await openedDialog.getByLabel(sourceLabel).fill("12");
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
      await expect(gain.getByTestId("valeur-estimee")).toHaveText("30%");
    }

    await opener.focus();
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Modifier la valeur",
      exact: true,
    });
    await expect(dialog.getByLabel(sourceLabel)).toBeFocused();
    await expect(dialog.getByText("Unité : %", { exact: true })).toBeVisible();
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
    await expect(gain.getByTestId("valeur-estimee")).toHaveText(
      `${correctedValue}%`,
    );
    await expect(gainNotes).toBeVisible();
    await expect(pendingAnalysis).toBeVisible();
    await expect(impactTab(page)).toHaveAccessibleDescription(
      "2 données à vérifier",
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
        { revision: 1, value: 30, email: null, date: expect.any(Date) },
        { revision: 2, value: correctedValue, email, date: expect.any(Date) },
      ]);
    } finally {
      await sql.end();
    }

    await page.reload();
    await expect(gain.getByTestId("valeur-estimee")).toHaveText(
      `${correctedValue}%`,
    );
    await expect(gainNotes).toBeVisible();
    await expect(pendingAnalysis).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);

    responseState = "recalculated";
    await page.reload();
    await expect(gainNotes).toHaveCount(0);
    await expect(pendingAnalysis).toHaveCount(0);
    await expect(impactTab(page)).not.toHaveAttribute("aria-describedby");
    await expect(gain.getByTestId("valeur-estimee")).toHaveText(
      `${correctedValue}%`,
    );

    responseState = "unavailable";
    await page.reload();
    await expect(page.locator(".fr-alert")).toContainText(
      "Les données Fonds vert sont temporairement indisponibles.",
    );
    await expect(gain.getByTestId("valeur-estimee")).toHaveText(
      `${correctedValue}%`,
    );
  });
}
