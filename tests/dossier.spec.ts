import {
  expect,
  graphql,
  http,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  AGENCE_EAU_NUMBER,
  CENTRE_COUTS,
  CENTRE_COUTS_2C,
  CENTRE_COUTS_2D,
  COMMUNE,
  COMPANY_NAME,
  CONTACT_EMAIL,
  DEPARTMENT,
  DOSSIER_NUMBER,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
  PROJECT_TITLE_LONG,
  SIRET,
} from "./fixtures/constants";
import {
  DEFAULT_STATUT_UPDATED_AT,
  getDossierData,
  makeDemarcheDossiersData,
  makeDossierDataWithNumber,
  makeDossierDataWithTitle,
} from "./fixtures/ds";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ1Data,
  fondsVertFinancesEJ2Data,
  fondsVertLoginData,
} from "./fixtures/fondsvert";
import { gristChampsDS } from "./fixtures/grist";
import { authenticatePage } from "./setup/auth";
import {
  deleteStoredDossierMetrics,
  getStoredDossierMetrics,
  importStoredDossierMetricsIfMissing,
} from "./setup/db";

async function waitForDsfrTabs(page: Page) {
  await page.waitForSelector("[data-fr-js-tab-button]");
}

async function waitForDsfrModal(page: Page) {
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });
}

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const impactDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function formatImpactDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return impactDateFormatter.format(date);
}

test.beforeEach(async ({ page }) => {
  await deleteStoredDossierMetrics(DOSSIER_NUMBER);
  await authenticatePage(page);
});

test.use({
  mswHandlers: [
    [
      ds.query("getDossier", () => {
        return HttpResponse.json(getDossierData);
      }),

      ds.query("getDossierAccess", () => {
        const { demandeur, groupeInstructeur, usager } =
          getDossierData.data.dossier;
        return HttpResponse.json({
          data: {
            dossier: { demandeur, groupeInstructeur, usager },
          },
        });
      }),

      ds.query("getDemarcheDossiers", () => {
        return HttpResponse.json(makeDemarcheDossiersData());
      }),

      http.post("http://fondsvert/fonds_vert/login", () => {
        return HttpResponse.json(fondsVertLoginData);
      }),

      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () => {
          return HttpResponse.json(fondsVertDossierData);
        },
      ),

      http.get("http://grist/docs/id/tables/Champs_DS/records", () => {
        return HttpResponse.json(gristChampsDS);
      }),

      http.get("http://fondsvert/fonds_vert/v2/finances/2105212345", () => {
        return HttpResponse.json(fondsVertFinancesEJ1Data);
      }),

      http.get("http://fondsvert/fonds_vert/v2/finances/2106789012", () => {
        return HttpResponse.json(fondsVertFinancesEJ2Data);
      }),
    ],
    { scope: "test" },
  ],
});

test("dossier page displays project presentation correctly", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    PROJECT_TITLE,
  );
  await expect(page.getByText(PROGRAM_TITLE)).toBeVisible();
  await expect(page.getByText("Édition 2023")).toBeVisible();

  const projectSection = page.locator("section", {
    has: page.getByRole("heading", { name: "Présentation du projet" }),
  });

  await expect(projectSection).toContainText(PROJECT_SUMMARY);
  await expect(
    projectSection.getByLabel("Département d'implantation"),
  ).toContainText(DEPARTMENT);
  await expect(
    projectSection.getByLabel("Commune principale impactée"),
  ).toContainText(COMMUNE);
  await expect(projectSection.getByText(AGENCE_EAU_NUMBER)).toBeVisible();
});

test("dossier page displays project owner identity correctly", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const identitySection = page.locator("section", {
    has: page.getByRole("heading", { name: "Identité du porteur de projet" }),
  });

  await expect(identitySection.getByLabel("Nom du porteur")).toContainText(
    COMPANY_NAME,
  );
  await expect(identitySection.getByLabel("SIRET")).toContainText(SIRET);
  await expect(identitySection.getByLabel("Représentant légal")).toContainText(
    LEGAL_REPRESENTATIVE_EMAIL,
  );
  await expect(
    identitySection.getByLabel("Responsable du suivi"),
  ).toContainText(CONTACT_EMAIL);
});

test("dossier page displays subvention financial details correctly", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(
    page.getByLabel("Montant total des dépenses du projet"),
  ).toContainText("18 939 933,00 €");

  const aideFondsVert = page.getByRole("region", {
    name: "Aide du Fonds vert",
  });
  await expect(aideFondsVert.getByLabel("Montant attribué")).toContainText(
    "10 073 564,00 €",
  );
  await expect(aideFondsVert.getByLabel("Montant total payé")).toContainText(
    "6 122 079,20 €",
  );

  const engagementJuridique = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(engagementJuridique).toBeVisible();
  await expect(
    engagementJuridique.getByLabel("Montant attribué initial", {
      exact: true,
    }),
  ).toContainText("10 073 574,00 €");
  await expect(
    engagementJuridique.getByLabel("Montant attribué en 2025"),
  ).toContainText("6 651 494,80 €");
  await expect(engagementJuridique.getByLabel("Montant restant")).toContainText(
    "6 651 494,80 €",
  );
});

test("displays two engagement juridique sections with tabs", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const allEngagements = page.getByRole("region", {
    name: /Engagement juridique n°/,
  });
  await expect(allEngagements).toHaveCount(2);

  const engagement1 = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(
    engagement1.getByRole("tab", { name: "Informations" }),
  ).toBeVisible();
  await expect(
    engagement1.getByRole("tab", { name: "Historique" }),
  ).toBeVisible();

  const engagement2 = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });
  await expect(
    engagement2.getByRole("tab", { name: "Informations" }),
  ).toBeVisible();
  await expect(
    engagement2.getByRole("tab", { name: "Historique" }),
  ).toBeVisible();
});

test("engagement information tab shows amounts, fournisseur, centre de coût and last payment", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);
  await waitForDsfrTabs(page);

  const engagement1 = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(
    engagement1.getByLabel("Montant attribué initial"),
  ).toContainText("10 073 574,00 €");
  await expect(
    engagement1.getByLabel("Montant attribué en 2025"),
  ).toContainText("6 651 494,80 €");
  await expect(engagement1.getByLabel("Montant restant")).toContainText(
    "6 651 494,80 €",
  );
  await expect(engagement1.getByLabel("Fournisseur")).toContainText(
    COMPANY_NAME,
  );
  await expect(engagement1.getByLabel("Centre de coût")).toContainText(
    CENTRE_COUTS,
  );
  await expect(engagement1.getByLabel("Dernier paiement")).toContainText(
    "3 422 079,20 €",
  );
});

test("engagement history tab displays yearly breakdown with payments", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);
  await waitForDsfrTabs(page);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });

  const historiqueTab = engagement.getByRole("tab", { name: "Historique" });
  await historiqueTab.click();
  await expect(
    engagement.getByRole("tabpanel", { name: "Historique" }),
  ).toBeVisible();

  const rows = engagement.getByRole("row");
  await expect(rows).toHaveCount(4);

  const annee2025 = rows.nth(1);
  await expect(annee2025.getByRole("cell").nth(0)).toContainText("2025");
  await expect(annee2025.getByRole("cell").nth(1)).toContainText(
    "6 651 494,80 €",
  );
  await expect(annee2025.getByRole("cell").nth(2)).toContainText(
    "Aucun paiement",
  );

  const annee2024 = rows.nth(2);
  await expect(annee2024.getByRole("cell").nth(0)).toContainText("2024");
  await expect(annee2024.getByRole("cell").nth(1)).toContainText(
    "10 073 574,00 €",
  );
  await expect(annee2024.getByRole("cell").nth(2)).toContainText(
    "3 422 079,20 €",
  );
  await expect(annee2024.getByRole("cell").nth(3)).toContainText(
    "7 octobre 2024",
  );
  await expect(annee2024.getByRole("cell").nth(4)).toContainText("1001234567");

  const annee2023 = rows.nth(3);
  await expect(annee2023.getByRole("cell").nth(0)).toContainText("2023");
  await expect(annee2023.getByRole("cell").nth(1)).toContainText(
    "10 073 574,00 €",
  );
  await expect(annee2023.getByRole("cell").nth(2)).toContainText(
    "Aucun paiement",
  );
});

test("engagement with multiple payments shows each payment as separate row", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);
  await waitForDsfrTabs(page);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });

  await expect(engagement.getByLabel("Montant attribué initial")).toContainText(
    "2 500 000,00 €",
  );
  await expect(engagement.getByLabel("Montant attribué en 2025")).toContainText(
    "500 000,00 €",
  );
  await expect(engagement.getByLabel("Montant restant")).toContainText(
    "300 000,00 €",
  );
  await expect(engagement.getByLabel("Fournisseur")).toContainText(
    COMPANY_NAME,
  );
  await expect(engagement.getByLabel("Centres de coût")).toContainText(
    `${CENTRE_COUTS_2C}, ${CENTRE_COUTS_2D}`,
  );
  await expect(engagement.getByLabel("Dernier paiement")).toContainText(
    "200 000,00 €",
  );
  await expect(engagement.getByLabel("Date de paiement")).toContainText(
    "10 février 2025",
  );

  const historiqueTab = engagement.getByRole("tab", { name: "Historique" });
  await historiqueTab.click();
  await expect(
    engagement.getByRole("tabpanel", { name: "Historique" }),
  ).toBeVisible();

  const rows = engagement.getByRole("row");
  await expect(rows).toHaveCount(5);

  const annee2025 = rows.nth(1);
  await expect(annee2025.getByRole("cell").nth(0)).toContainText("2025");
  await expect(annee2025.getByRole("cell").nth(1)).toContainText(
    "500 000,00 €",
  );
  await expect(annee2025.getByRole("cell").nth(2)).toContainText(
    "200 000,00 €",
  );
  await expect(annee2025.getByRole("cell").nth(3)).toContainText(
    "10 février 2025",
  );
  await expect(annee2025.getByRole("cell").nth(4)).toContainText("1009876546");

  const payment2024_latest = rows.nth(2);
  await expect(payment2024_latest.getByRole("cell").nth(0)).toContainText(
    "2024",
  );
  await expect(payment2024_latest.getByRole("cell").nth(1)).toContainText(
    "2 000 000,00 €",
  );
  await expect(payment2024_latest.getByRole("cell").nth(2)).toContainText(
    "1 250 000,00 €",
  );
  await expect(payment2024_latest.getByRole("cell").nth(3)).toContainText(
    "5 août 2024",
  );
  await expect(payment2024_latest.getByRole("cell").nth(4)).toContainText(
    "1009876545",
  );

  const payment2024_earlier = rows.nth(3);
  await expect(payment2024_earlier.getByRole("cell").nth(0)).toContainText(
    "2024",
  );
  await expect(payment2024_earlier.getByRole("cell").nth(1)).toContainText(
    "2 000 000,00 €",
  );
  await expect(payment2024_earlier.getByRole("cell").nth(2)).toContainText(
    "750 000,00 €",
  );
  await expect(payment2024_earlier.getByRole("cell").nth(3)).toContainText(
    "22 mars 2024",
  );
  await expect(payment2024_earlier.getByRole("cell").nth(4)).toContainText(
    "1009876544",
  );

  const payment2023 = rows.nth(4);
  await expect(payment2023.getByRole("cell").nth(0)).toContainText("2023");
  await expect(payment2023.getByRole("cell").nth(1)).toContainText(
    "2 500 000,00 €",
  );
  await expect(payment2023.getByRole("cell").nth(2)).toContainText(
    "500 000,00 €",
  );
  await expect(payment2023.getByRole("cell").nth(3)).toContainText(
    "15 décembre 2023",
  );
  await expect(payment2023.getByRole("cell").nth(4)).toContainText(
    "1009876543",
  );
});

test("dossier page displays impact metrics correctly", async ({ page }) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  // Métriques avant/après travaux

  const consoEnergetique = page.getByTestId("metric-consommation-energetique");
  await expect(consoEnergetique).toContainText("Consommation énergétique");
  await expect(consoEnergetique.getByTestId("valeur-0")).toContainText(
    "2 055 650",
  );
  await expect(consoEnergetique.getByTestId("valeur-1")).toContainText(
    "1 935 960",
  );

  // Métriques simples

  const emissionsGES = page.getByTestId("metric-emissions-de-ges");
  await expect(emissionsGES).toContainText("Émissions de GES");

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
  ).toHaveCount(2);
});

test("validates and submits a numeric metric correction once", async ({
  page,
  msw,
}) => {
  const correctionDossierNumber = 89000012;

  await deleteStoredDossierMetrics(correctionDossierNumber);
  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(
        makeDossierDataWithNumber(correctionDossierNumber),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${correctionDossierNumber}`,
      () => HttpResponse.json(fondsVertDossierData),
    ),
  );

  await importStoredDossierMetricsIfMissing({
    dossierNumber: correctionDossierNumber,
    metrics: {
      number_metric: {
        label: "Métrique numérique",
        unite: "ha",
        valeur_estimee: 1,
      },
    },
  });

  try {
    await page.goto(`/projets/${correctionDossierNumber}`);
    await waitForDsfrModal(page);

    const numberCard = page.getByRole("region", {
      name: "Métrique numérique",
    });
    await numberCard.getByRole("button", { name: "Modifier" }).click();
    let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    const numberInput = dialog.getByLabel("Métrique numérique");
    await expect(dialog.getByLabel("Valeur source")).toHaveCount(0);
    await numberInput.fill("");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog.getByText("Saisissez un nombre valide.")).toBeVisible();
    await expect(numberInput).toBeFocused();

    let releaseNumberRequest: (() => void) | undefined;
    const numberRequestGate = new Promise<void>((resolve) => {
      releaseNumberRequest = resolve;
    });
    let numberRequestCount = 0;
    await page.route("**/metrics/number_metric", async (route) => {
      numberRequestCount += 1;
      await numberRequestGate;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          target: {
            metricCode: "number_metric",
            revision: 2,
            label: "Métrique numérique",
            unit: "ha",
            valueType: "number",
            sourceValue: 1,
            effectiveValue: 2.5,
          },
        }),
      });
    });

    await numberInput.fill("2,5");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect.poll(() => numberRequestCount, { timeout: 5000 }).toBe(1);
    await expect(
      dialog.getByRole("button", { name: "Enregistrement…" }),
    ).toBeDisabled();
    await dialog.locator("form").evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    expect(numberRequestCount).toBe(1);
    releaseNumberRequest?.();
    await expect(dialog).toBeHidden();
    await expect(numberCard.getByLabel("Valeur effective")).toHaveText(
      /2,5\s*ha/,
    );
    await expect(
      page.getByRole("status").filter({
        hasText: "Correction enregistrée pour « Métrique numérique ».",
      }),
    ).toBeVisible();
    await expect(numberCard.getByRole("status")).toHaveCount(0);
    await page.unroute("**/metrics/number_metric");
    await numberCard.getByRole("button", { name: "Modifier" }).click();
    dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await expect(numberCard.getByRole("status")).toHaveCount(0);
    await expect(dialog.getByLabel("Valeur source")).toHaveCount(0);
    await expect(dialog.getByLabel("Métrique numérique")).toHaveValue("2.5");

    await page.route("**/metrics/number_metric", (route) =>
      route.fulfill({
        status: 500,
        contentType: "text/plain",
        body: "Service indisponible",
      }),
    );
    await dialog.getByLabel("Métrique numérique").fill("3,5");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(
      dialog.getByText("La correction n’a pas pu être enregistrée."),
    ).toBeVisible();
  } finally {
    await deleteStoredDossierMetrics(correctionDossierNumber);
  }
});

test("persists a correction submitted from the standard dossier page", async ({
  page,
  msw,
}) => {
  const correctionDossierNumber = 89000016;

  await deleteStoredDossierMetrics(correctionDossierNumber);
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json(makeDossierDataWithNumber(correctionDossierNumber)),
    ),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${correctionDossierNumber}`,
      () => HttpResponse.json(fondsVertDossierData),
    ),
  );
  await importStoredDossierMetricsIfMissing({
    dossierNumber: correctionDossierNumber,
    metrics: {
      persistent_metric: {
        label: "Métrique persistante",
        unite: "ha",
        valeur_estimee: 10,
      },
    },
  });

  try {
    await page.goto(`/projets/${correctionDossierNumber}`);
    await waitForDsfrModal(page);

    const metricCard = page.getByRole("region", {
      name: "Métrique persistante",
    });
    await metricCard.getByRole("button", { name: "Modifier" }).click();
    const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Métrique persistante").fill("12,5");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();

    await expect(dialog).toBeHidden();
    await expect(metricCard.getByLabel("Valeur effective")).toHaveText(
      /12,5\s*ha/,
    );
    await expect
      .poll(() => getStoredDossierMetrics(correctionDossierNumber))
      .toMatchObject({
        persistent_metric: { valeur_estimee: 12.5 },
      });

    await page.reload();
    await expect(metricCard.getByLabel("Valeur effective")).toHaveText(
      /12,5\s*ha/,
    );
  } finally {
    await deleteStoredDossierMetrics(correctionDossierNumber);
  }
});

test("edits text, boolean and multiple metrics from their cards", async ({
  page,
  msw,
}) => {
  const correctionDossierNumber = 89000013;

  await deleteStoredDossierMetrics(correctionDossierNumber);
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json(makeDossierDataWithNumber(correctionDossierNumber)),
    ),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${correctionDossierNumber}`,
      () => HttpResponse.json(fondsVertDossierData),
    ),
  );
  await importStoredDossierMetricsIfMissing({
    dossierNumber: correctionDossierNumber,
    metrics: {
      text_metric: {
        label: "Métrique texte",
        unite: null,
        valeur_estimee: "Source",
      },
      boolean_metric: {
        label: "Métrique booléenne",
        unite: null,
        valeur_estimee: false,
      },
      array_metric: {
        label: "Métrique multiple",
        unite: null,
        valeur_estimee: ["Source A", "Source B"],
      },
    },
  });

  try {
    await page.goto(`/projets/${correctionDossierNumber}`);
    await waitForDsfrModal(page);

    const textCard = page.getByRole("region", { name: "Métrique texte" });
    await textCard.getByRole("button", { name: "Modifier" }).click();
    let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Métrique texte").fill("Valeur corrigée");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(textCard.getByLabel("Valeur effective")).toHaveText(
      "Valeur corrigée",
    );

    const booleanCard = page.getByRole("region", {
      name: "Métrique booléenne",
    });
    await booleanCard.getByRole("button", { name: "Modifier" }).click();
    dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Oui", { exact: true }).check({ force: true });
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(booleanCard.getByLabel("Valeur effective")).toHaveText("Oui");

    const arrayCard = page.getByRole("region", {
      name: "Métrique multiple",
    });
    await arrayCard.getByRole("button", { name: "Modifier" }).click();
    dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    const valuesEditor = dialog.getByRole("group", {
      name: "Valeurs à modifier",
    });
    const firstValue = valuesEditor.getByRole("textbox", {
      name: "Valeur 1",
      exact: true,
    });
    const secondValue = valuesEditor.getByRole("textbox", {
      name: "Valeur 2",
      exact: true,
    });
    await expect(firstValue).toHaveValue("Source A");
    await expect(secondValue).toHaveValue("Source B");

    await firstValue.fill("Première valeur");
    await secondValue.fill("Première valeur");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(
      valuesEditor.getByText("Chaque valeur doit être unique."),
    ).toBeVisible();
    await expect(secondValue).toBeFocused();

    await secondValue.fill("Deuxième valeur");
    await valuesEditor
      .getByRole("button", { name: "Ajouter une valeur" })
      .click();
    const thirdValue = valuesEditor.getByRole("textbox", {
      name: "Valeur 3",
      exact: true,
    });
    await expect(thirdValue).toBeFocused();
    await thirdValue.fill("Valeur temporaire");
    await valuesEditor
      .getByRole("button", { name: "Supprimer la valeur 3" })
      .click();
    await expect(thirdValue).toHaveCount(0);
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    const effectiveValues = arrayCard.getByLabel("Valeur effective");
    await expect(
      effectiveValues.getByText("Première valeur", { exact: true }),
    ).toBeVisible();
    await expect(
      effectiveValues.getByText("Deuxième valeur", { exact: true }),
    ).toBeVisible();
  } finally {
    await deleteStoredDossierMetrics(correctionDossierNumber);
  }
});

test("edits before and after metrics independently", async ({ page, msw }) => {
  const correctionDossierNumber = 89000014;

  await deleteStoredDossierMetrics(correctionDossierNumber);
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json(makeDossierDataWithNumber(correctionDossierNumber)),
    ),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${correctionDossierNumber}`,
      () => HttpResponse.json(fondsVertDossierData),
    ),
  );
  await importStoredDossierMetricsIfMissing({
    dossierNumber: correctionDossierNumber,
    metrics: {
      energy_before: {
        label: "Énergie test avant travaux",
        unite: "kWh",
        valeur_estimee: 100,
      },
      energy_after: {
        label: "Énergie test après travaux",
        unite: "kWh",
        valeur_estimee: 80,
      },
    },
  });

  try {
    await page.goto(`/projets/${correctionDossierNumber}`);
    await waitForDsfrModal(page);

    const beforeAfterCard = page.getByRole("region", { name: "Énergie test" });
    const beforeRow = beforeAfterCard.getByRole("group", {
      name: "Avant travaux",
    });
    const afterRow = beforeAfterCard.getByRole("group", {
      name: "Après travaux",
    });
    const editBefore = beforeRow.getByRole("button", { name: "Modifier" });
    const editAfter = afterRow.getByRole("button", { name: "Modifier" });

    await editBefore.click();
    let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Énergie test avant travaux").fill("120");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(beforeRow).toContainText("120");
    await expect(afterRow).toContainText("80");

    await editAfter.click();
    dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Énergie test après travaux").fill("70");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(beforeRow).toContainText("120");
    await expect(afterRow).toContainText("70");
  } finally {
    await deleteStoredDossierMetrics(correctionDossierNumber);
  }
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
    await page.goto(`/projets/${storedMetricsDossierNumber}`);

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
    await expect(
      page.getByLabel("Montant total des dépenses du projet"),
    ).toContainText("18 939 933,00 €");
    expect(includeMetricsRequests).toEqual(["false"]);

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
    await page.goto(`/projets/${apiMetricsDossierNumber}`);

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
    await page.goto(`/projets/${emptyMetricsDossierNumber}`);

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
    await page.goto(`/projets/${unavailableMetricsDossierNumber}`);

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
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

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

test("navigation links work correctly", async ({ page }) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(
    page.locator('[data-testid="breadcrumb-current"] ol > li:first-child > a'),
  ).toHaveAttribute("href", "/");

  const backLink = "/projets?siret=12345678910111";

  await expect(
    page.locator('[data-testid="breadcrumb-current"] ol > li:nth-child(2) > a'),
  ).toHaveAttribute("href", backLink);

  const footerBack = page.getByTestId("footer-back");
  await expect(footerBack).toHaveAttribute("href", backLink);
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
    await page.goto(`/projets/${retryWithoutMetricsDossierNumber}`);

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
      engagementJuridique.getByLabel("Montant attribué initial"),
    ).toContainText("10 073 574,00 €");

    const impactSection = page.getByTestId("impact-section");
    await expect(impactSection).not.toBeAttached();

    expect(includeMetricsRequests).toEqual(["true", "false"]);
    expect(
      await getStoredDossierMetrics(retryWithoutMetricsDossierNumber),
    ).toBeUndefined();

    await page.reload();

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
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

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

test("dossier page displays calendar timeline with correct dates and status", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const calendarSection = page.getByRole("region", {
    name: "Calendrier",
  });

  await expect(calendarSection.getByText("Dépôt du dossier")).toBeVisible();
  await expect(calendarSection.getByText("15 juin 2023")).toBeVisible();

  await expect(calendarSection.getByText("Notification")).toBeVisible();
  await expect(calendarSection.getByText("20 septembre 2023")).toBeVisible();

  await expect(calendarSection.getByText("Début d'exécution")).toBeVisible();
  await expect(calendarSection.getByText("15 janvier 2024")).toBeVisible();

  await expect(calendarSection.getByText("Fin d'exécution")).toBeVisible();
  await expect(calendarSection.getByText("31 décembre 2099")).toBeVisible();

  const timelineItems = calendarSection.locator("li");
  await expect(timelineItems.nth(0)).toContainText("terminé");
  await expect(timelineItems.nth(1)).toContainText("terminé");
  await expect(timelineItems.nth(2)).toContainText("terminé");
  await expect(timelineItems.nth(3)).toContainText("à venir");
});

test("impact evaluation sidebar displays last modification date", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const evaluationSection = page.getByRole("region", {
    name: "Les données de votre projet participent à la transition écologique",
  });

  await expect(
    evaluationSection.getByText(
      `Dernière modification : ${formatImpactDate(DEFAULT_STATUT_UPDATED_AT)}`,
    ),
  ).toBeVisible();
  await expect(
    evaluationSection.getByRole("link", { name: "Mettre à jour les données" }),
  ).toBeVisible();
});

test("calendar timeline marks step as done when later step is done, even with missing date", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
      () => {
        return HttpResponse.json({
          data: {
            ...fondsVertDossierData.data,
            socle_commun: {
              ...fondsVertDossierData.data.socle_commun,
              date_notification: null,
            },
          },
        });
      },
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const calendarSection = page.getByRole("region", {
    name: "Calendrier",
  });

  await expect(calendarSection.getByText("Date non renseignée")).toBeVisible();

  const timelineItems = calendarSection.locator("li");

  await expect(timelineItems.nth(0)).toContainText("terminé");
  await expect(timelineItems.nth(1)).toContainText("terminé");
  await expect(timelineItems.nth(2)).toContainText("terminé");
  await expect(timelineItems.nth(3)).toContainText("à venir");
});

test("access denied shows error page and does not render FV/EJ data", async ({
  page,
  msw,
}) => {
  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json({
        data: { dossier: null },
      });
    }),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(page.getByText("Introuvable")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Aide du Fonds vert" }),
  ).not.toBeAttached();
  await expect(
    page.getByRole("region", { name: /Engagement juridique/ }),
  ).not.toBeAttached();
});

test("EJ finances error shows alert but rest of page remains intact", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/finances/2105212345", () => {
      return HttpResponse.json({ error: "Server Error" }, { status: 500 });
    }),
    http.get("http://fondsvert/fonds_vert/v2/finances/2106789012", () => {
      return HttpResponse.json({ error: "Server Error" }, { status: 500 });
    }),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(
    page.getByText(
      "Les détails des engagements juridiques (montant attribué initial, fournisseur, centre de coût) sont temporairement indisponibles.",
    ),
  ).toBeVisible();

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
    engagementJuridique.getByLabel("Montant attribué initial"),
  ).not.toBeAttached();
  await expect(
    engagementJuridique.getByLabel("Fournisseur"),
  ).not.toBeAttached();
  await expect(
    engagementJuridique.getByLabel("Centre de coût"),
  ).not.toBeAttached();
});

test("long project titles are truncated with ellipsis", async ({
  page,
  msw,
}) => {
  msw.use(
    ds.query("getDossier", () => {
      return HttpResponse.json(makeDossierDataWithTitle(PROJECT_TITLE_LONG));
    }),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText("...");
  await expect(heading).not.toContainText(PROJECT_TITLE_LONG);
  await expect(heading).toContainText(PROJECT_TITLE_LONG.slice(0, 80));
});

test("engagement juridique displays etat engagement badge", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });

  await expect(
    engagement.getByText("Statut des paiements de la subvention"),
  ).toBeVisible();
  await expect(engagement.getByText("En cours")).toBeVisible();
});

test("engagement juridique hides badge for unknown etat engagement", async ({
  page,
  msw,
}) => {
  const dataWithUnknownEtat = {
    data: {
      ...fondsVertDossierData.data,
      information_financiere: {
        informations_engagement: [
          {
            annee_information_financiere: 2025,
            montant_paye_per_dossier: null,
            etat_engagement: "nouveau statut inconnu",
            engagements_juridiques: [
              {
                numero_ej: "2105212345",
                nom_demarche: PROGRAM_TITLE,
                nom_axe: 1,
                montant_engage: 10000,
                demandes_paiement: [],
              },
            ],
          },
        ],
      },
    },
  };

  msw.use(
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
      () => {
        return HttpResponse.json(dataWithUnknownEtat);
      },
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });

  await expect(engagement).toBeVisible();
  await expect(
    engagement.getByText("Statut des paiements de la subvention"),
  ).not.toBeAttached();
});

test("dossier page displays statut de réalisation from impact demarche", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const statusSection = page.getByRole("region", {
    name: "Avancement du projet",
  });

  await expect(page.getByText("Avancement du projet")).toBeVisible();
  await expect(
    page.locator(".fr-badge--info", { hasText: "En cours de réalisation" }),
  ).toBeVisible();
  await expect(
    statusSection.getByText(
      `Dernière modification : ${formatImpactDate(DEFAULT_STATUT_UPDATED_AT)}`,
    ),
  ).toBeVisible();
});

test("dossier page falls back to Fonds Vert when DS returns no recent impact", async ({
  page,
  msw,
}) => {
  const fondsVertUpdatedAt = "2024-02-14T08:30:00.000Z";
  const fondsVertStatut = "Bloqué";
  let receivedCreatedSince: string | undefined;

  msw.use(
    ds.query("getDemarcheDossiers", ({ variables }) => {
      receivedCreatedSince = variables.createdSince ?? undefined;
      return HttpResponse.json(
        makeDemarcheDossiersData({ includeImpactDossier: false }),
      );
    }),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
      () => {
        return HttpResponse.json({
          data: {
            ...fondsVertDossierData.data,
            socle_commun: {
              ...fondsVertDossierData.data.socle_commun,
              date_derniere_modification: fondsVertUpdatedAt,
              statut_realisation_projet: fondsVertStatut,
            },
          },
        });
      },
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  expect(receivedCreatedSince).toBeTruthy();

  const statusSection = page.getByRole("region", {
    name: "Avancement du projet",
  });

  await expect(
    statusSection.locator(".fr-badge--warning", { hasText: fondsVertStatut }),
  ).toBeVisible();
  await expect(
    statusSection.getByText(
      `Dernière modification : ${formatImpactDate(fondsVertUpdatedAt)}`,
    ),
  ).toBeVisible();

  const evaluationSection = page.getByRole("region", {
    name: "Les données de votre projet participent à la transition écologique",
  });

  await expect(
    evaluationSection.getByText(
      `Dernière modification : ${formatImpactDate(fondsVertUpdatedAt)}`,
    ),
  ).toBeVisible();
});

const STATUT_REALISATION_CASES = [
  { statut: "Non-commencé", badgeClass: ".fr-badge--new" },
  { statut: "En cours de réalisation", badgeClass: ".fr-badge--info" },
  { statut: "Bloqué", badgeClass: ".fr-badge--warning" },
  { statut: "Abandonné", badgeClass: ".fr-badge--error" },
  { statut: "Terminé", badgeClass: ".fr-badge--success" },
] as const;

for (const { statut, badgeClass } of STATUT_REALISATION_CASES) {
  test(`dossier page displays statut de réalisation "${statut}" with correct badge severity`, async ({
    page,
    msw,
  }) => {
    msw.use(
      ds.query("getDemarcheDossiers", () => {
        return HttpResponse.json(
          makeDemarcheDossiersData({
            statutRealisation: statut,
            updatedAt: DEFAULT_STATUT_UPDATED_AT,
          }),
        );
      }),
    );

    await page.goto(`/projets/${DOSSIER_NUMBER}`);

    await expect(page.locator(badgeClass, { hasText: statut })).toBeVisible();
  });
}

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
    await page.goto(`/projets/${metricsDossierNumber}`);

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
    await page.goto(`/projets/${booleanMetricDossierNumber}`);

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

test("dossier page displays INCONNU status when no impact dossier", async ({
  page,
  msw,
}) => {
  msw.use(
    ds.query("getDemarcheDossiers", () => {
      return HttpResponse.json(
        makeDemarcheDossiersData({ includeImpactDossier: false }),
      );
    }),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(page.getByText("Avancement du projet")).toBeVisible();
  await expect(
    page.locator(".fr-badge--warning", { hasText: "INCONNU" }),
  ).toBeVisible();
});
