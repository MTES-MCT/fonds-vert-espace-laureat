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

async function waitForDsfrTabs(page: Page) {
  await page.waitForSelector("[data-fr-js-tab-button]");
}

const ds = graphql.link("https://www.demarches-simplifiees.fr/api/v2/graphql");
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
  await authenticatePage(page);
});

test.use({
  mswHandlers: [
    [
      ds.query("getDossier", () => {
        return HttpResponse.json(getDossierData);
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
    "6 122 079,20 €",
  );

  const engagementJuridique = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(engagementJuridique).toBeVisible();
  await expect(
    engagementJuridique.getByLabel("Montant attribué initial"),
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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);
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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);
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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

  await expect(
    page.getByRole("link", { name: "Mettre à jour les données" }),
  ).toHaveCount(2);
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

        requestCount++;

        if (includeMetrics === "true") {
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

  const engagementJuridique = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(
    engagementJuridique.getByLabel("Montant attribué initial"),
  ).toContainText("10 073 574,00 €");

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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText("...");
  await expect(heading).not.toContainText(PROJECT_TITLE_LONG);
  await expect(heading).toContainText(PROJECT_TITLE_LONG.slice(0, 80));
});

test("engagement juridique displays etat engagement badge", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

    await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

    await expect(page.locator(badgeClass, { hasText: statut })).toBeVisible();
  });
}

test("dossier page displays metrics", async ({ page, msw }) => {
  msw.use(
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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
  const tags = natures.locator("li");
  await expect(tags).toHaveCount(2);
  await expect(tags.nth(0)).toContainText("Friche commerciale");

  await expect(
    impactSection.getByTestId(
      "metric-activites-de-bureaux---surface-de-plancher",
    ),
  ).not.toBeAttached();
});

test("dossier page displays boolean metric as Oui/Non", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const impactSection = page.getByTestId("impact-section");
  await expect(impactSection).toBeVisible();

  const solPollue = impactSection.getByTestId(
    "metric-les-sols-et-eaux-souterraines-de-la-friche-sont-ils-pollues",
  );
  await expect(solPollue).toBeVisible();
  await expect(solPollue.getByTestId("valeur-estimee")).toContainText("Non");
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

  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  await expect(page.getByText("Avancement du projet")).toBeVisible();
  await expect(
    page.locator(".fr-badge--warning", { hasText: "INCONNU" }),
  ).toBeVisible();
});
