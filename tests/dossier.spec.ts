import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  AGENCE_EAU_NUMBER,
  CHORUS_NUMBER,
  COMMUNE,
  COMPANY_NAME,
  CONTACT_EMAIL,
  DEPARTMENT,
  DOSSIER_NUMBER,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
  SIRET,
} from "./fixtures/constants";
import { getDemarcheDossiersData, getDossierData } from "./fixtures/ds";
import { fondsVertDossierData, fondsVertLoginData } from "./fixtures/fondsvert";
import { gristChampsDS } from "./fixtures/grist";
import { authenticatePage } from "./setup/auth";

async function waitForDsfrTabs(page: any) {
  await page.waitForSelector("[data-fr-js-tab-button]");
}

const ds = graphql.link("https://www.demarches-simplifiees.fr/api/v2/graphql");

test.beforeEach(async ({ page }) => {
  await authenticatePage(page);
});

test.use({
  mswHandlers: [
    [
      ds.query("getDossier", () => {
        return HttpResponse.json(getDossierData);
      }),

      ds.query("getDemarcheDossiers", () => {
        return HttpResponse.json(getDemarcheDossiersData);
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
    ],
    { scope: "test" },
  ],
});

test("dossier page displays project presentation correctly", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
    "5 922 069,20 €",
  );

  await expect(page.getByTestId("chorus-number")).toContainText(CHORUS_NUMBER);

  const engagementJuridique = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(engagementJuridique).toBeVisible();
  await expect(
    engagementJuridique.getByLabel("Montant attribué"),
  ).toContainText("10 073 574,00 €");
  await expect(engagementJuridique.getByLabel("Montant restant")).toContainText(
    "6 651 504,80 €",
  );

  await expect(page.getByTestId("financial-timeline-container")).toBeVisible();
});

test("displays two engagement juridique sections with tabs", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  await expect(page.getByTestId("financial-timeline-container")).toBeVisible();

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

test("engagement information tab shows amounts and last payment", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);
  await waitForDsfrTabs(page);

  const engagement1 = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(engagement1.getByLabel("Montant attribué")).toContainText(
    "10 073 574,00 €",
  );
  await expect(engagement1.getByLabel("Montant restant")).toContainText(
    "6 651 504,80 €",
  );
  await expect(engagement1.getByLabel("Dernier paiement")).toContainText(
    "3 422 069,20 €",
  );
});

test("engagement history tab displays yearly breakdown with payments", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);
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
    "3 422 069,20 €",
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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);
  await waitForDsfrTabs(page);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });

  await expect(engagement.getByLabel("Montant attribué")).toContainText(
    "2 500 000,00 €",
  );
  await expect(engagement.getByLabel("Dernier paiement")).toContainText(
    "1 250 000,00 €",
  );
  await expect(engagement.getByLabel("Date de paiement")).toContainText(
    "5 août 2024",
  );

  const historiqueTab = engagement.getByRole("tab", { name: "Historique" });
  await historiqueTab.click();
  await expect(
    engagement.getByRole("tabpanel", { name: "Historique" }),
  ).toBeVisible();

  const rows = engagement.getByRole("row");
  await expect(rows).toHaveCount(4);

  const payment2024_1 = rows.nth(1);
  await expect(payment2024_1.getByRole("cell").nth(0)).toContainText("2024");
  await expect(payment2024_1.getByRole("cell").nth(1)).toContainText(
    "2 000 000,00 €",
  );
  await expect(payment2024_1.getByRole("cell").nth(2)).toContainText(
    "750 000,00 €",
  );
  await expect(payment2024_1.getByRole("cell").nth(3)).toContainText(
    "22 mars 2024",
  );
  await expect(payment2024_1.getByRole("cell").nth(4)).toContainText(
    "1009876544",
  );

  const payment2024_2 = rows.nth(2);
  await expect(payment2024_2.getByRole("cell").nth(0)).toContainText("2024");
  await expect(payment2024_2.getByRole("cell").nth(1)).toContainText(
    "2 000 000,00 €",
  );
  await expect(payment2024_2.getByRole("cell").nth(2)).toContainText(
    "1 250 000,00 €",
  );
  await expect(payment2024_2.getByRole("cell").nth(3)).toContainText(
    "5 août 2024",
  );
  await expect(payment2024_2.getByRole("cell").nth(4)).toContainText(
    "1009876545",
  );

  const payment2023 = rows.nth(3);
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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  // Métriques avant/après travaux

  const consoEnergetique = page.getByTestId("metric-consommation-energetique");
  await expect(consoEnergetique).toContainText("Consommation énergétique");
  await expect(consoEnergetique.getByTestId("valeur-0")).toContainText(
    "2 055 650",
  );
  await expect(consoEnergetique.getByTestId("valeur-1")).toContainText(
    "1 235 863",
  );
  await expect(consoEnergetique.getByTestId("valeur-2")).toContainText(
    "1 935 960",
  );

  // Métriques simples

  const emissionsGES = page.getByTestId("metric-emissions-de-ges");
  await expect(emissionsGES).toContainText("Émissions de GES");

  const gainEnergetique = page.getByTestId("metric-gain-energetique-estime");
  await expect(gainEnergetique).toContainText("Gain énergétique estimé");
  await expect(gainEnergetique.getByTestId("valeur-0")).toContainText("39%");
  await expect(gainEnergetique.getByTestId("valeur-1")).toContainText("32%");

  // Métriques de type Array

  const natureOperations = page.getByTestId("metric-nature-des-operations");
  await expect(natureOperations).toContainText("Nature des opérations");

  const natureOperationsTags = natureOperations.locator("li");
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

  const typeBatimentsTags = typeBatiments.locator("li");
  await expect(typeBatimentsTags).toHaveCount(2);
  await expect(typeBatimentsTags.nth(0)).toContainText(
    "École (établissement public du premier degré)",
  );
  await expect(typeBatimentsTags.nth(1)).toContainText(
    "Établissement public du second degré",
  );

  await expect(page.getByTestId("impact-evaluation-link")).toBeVisible();
});

test("dossier page organizes metrics by thematic groups correctly", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  await expect(
    page.locator('[data-testid="breadcrumb-current"] ol > li:first-child > a'),
  ).toHaveAttribute("href", "/");

  const backLink = "/espace-laureat?siret=12345678910111";

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
  let requestCount = 0;

  msw.use(
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
      ({ request }) => {
        const url = new URL(request.url);
        const includeMetrics = url.searchParams.get("include_metrics");
        const includeImpact = url.searchParams.get("include_impact");

        requestCount++;

        if (includeMetrics === "true" || includeImpact === "true") {
          return HttpResponse.json(
            { error: "Unprocessable Entity" },
            { status: 422 },
          );
        }

        return HttpResponse.json({
          data: {
            information_financiere:
              fondsVertDossierData.data.information_financiere,
          },
        });
      },
    ),
  );

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const aideFondsVert = page.getByRole("region", {
    name: "Aide du Fonds vert",
  });
  await expect(aideFondsVert.getByLabel("Montant attribué")).toContainText(
    "10 073 564,00 €",
  );

  await expect(page.getByTestId("chorus-number")).toContainText(CHORUS_NUMBER);

  const impactSection = page.getByTestId("impact-section");
  await expect(impactSection).not.toBeAttached();

  expect(requestCount).toBe(2);
});

test("dossier page filters out metrics with 'Donnée non disponible' in label", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const evaluationSection = page.getByRole("region", {
    name: "Les données de votre projet participent à la transition écologique",
  });

  await expect(
    evaluationSection.getByText("Dernière modification : 10 mars 2024"),
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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
