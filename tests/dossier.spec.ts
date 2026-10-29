import {
  expect,
  graphql,
  http,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  appendDossierMetricRevision,
  getDossierMetricRevisionTargets,
} from "@/db/dossierMetrics";

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
  getDossierData,
  makeDossierDataWithNumber,
  makeDossierDataWithTitle,
} from "./fixtures/ds";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ1Data,
  fondsVertFinancesEJ2Data,
  fondsVertLoginData,
} from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import {
  createTestDatabaseClient,
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

      http.post("http://fondsvert/fonds_vert/login", () => {
        return HttpResponse.json(fondsVertLoginData);
      }),

      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () => {
          return HttpResponse.json(fondsVertDossierData);
        },
      ),

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

  const projectSection = page.getByRole("region", {
    name: "Présentation du projet",
    exact: true,
  });

  await expect(projectSection).toContainText(PROJECT_SUMMARY);
  await expect(
    projectSection.getByLabel("Département d'implantation"),
  ).toContainText(DEPARTMENT);
  await expect(
    projectSection.getByLabel("Commune principale impactée"),
  ).toContainText(COMMUNE);
  await expect(projectSection.getByText(AGENCE_EAU_NUMBER)).toBeVisible();
  await expect(projectSection.locator("dl")).toHaveCount(1);
  await expect(projectSection.locator("dt")).toHaveText([
    "Département d'implantation",
    "Commune principale impactée",
    "Numéro de dossier agence de l'eau",
  ]);
});

test("dossier page displays project owner identity correctly", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const identitySection = page.getByRole("region", {
    name: "Identité du porteur de projet",
    exact: true,
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
  await expect(
    identitySection.getByRole("link", {
      name: LEGAL_REPRESENTATIVE_EMAIL,
      exact: true,
    }),
  ).toHaveAttribute("href", `mailto:${LEGAL_REPRESENTATIVE_EMAIL}`);
  await expect(
    identitySection.getByRole("link", { name: CONTACT_EMAIL, exact: true }),
  ).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
});

test("le lecteur voit une absence explicite quand les deux courriels de contact ne sont pas renseignés dans DN", async ({
  page,
  msw,
}) => {
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json({
        data: {
          dossier: {
            ...getDossierData.data.dossier,
            champs: getDossierData.data.dossier.champs.map((champ) =>
              champ.champDescriptorId === "Q2hhbXAtMzgwNTc1Mw==" ||
              champ.champDescriptorId === "Q2hhbXAtMjkzNDQwMA=="
                ? { ...champ, stringValue: "" }
                : champ,
            ),
          },
        },
      }),
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const identite = page.getByRole("region", {
    name: "Identité du porteur de projet",
  });
  for (const label of ["Représentant légal", "Responsable du suivi"]) {
    const courriel = identite.getByLabel(label);
    await expect(courriel).toHaveText("Email non disponible");
    await expect(courriel.getByRole("link")).toHaveCount(0);
  }
  await expect(identite.getByLabel("Nom du porteur")).toHaveText(COMPANY_NAME);
  await expect(identite.getByLabel("SIRET")).toHaveText(SIRET);
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`le lecteur consulte la présentation, l’identité, l’avancement et le calendrier dans la synthèse à ${viewport.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/projets/${DOSSIER_NUMBER}`);

    const synthese = page.getByRole("region", {
      name: "Synthèse du projet",
      exact: true,
    });
    await expect(
      synthese.getByRole("heading", {
        level: 2,
        name: "Synthèse du projet",
        exact: true,
      }),
    ).toBeVisible();
    await expect(synthese.getByRole("heading", { level: 3 })).toHaveText([
      "Présentation du projet",
      "Identité du porteur de projet",
      "Avancement du projet",
      "Calendrier",
    ]);
    await expect
      .poll(() =>
        synthese.evaluate((element) => {
          let cadre: Element | null = element;
          while (
            cadre &&
            cadre !== document.body &&
            getComputedStyle(cadre).backgroundColor === "rgba(0, 0, 0, 0)"
          ) {
            cadre = cadre.parentElement;
          }
          return (
            cadre !== null &&
            cadre !== document.body &&
            getComputedStyle(cadre).backgroundColor === "rgb(255, 255, 255)"
          );
        }),
      )
      .toBe(true);

    const presentation = synthese.getByRole("region", {
      name: "Présentation du projet",
    });
    const identite = synthese.getByRole("region", {
      name: "Identité du porteur de projet",
    });
    const avancement = synthese.getByRole("region", {
      name: "Avancement du projet",
    });
    const calendrier = synthese.getByRole("region", { name: "Calendrier" });
    const zones = [presentation, identite, avancement, calendrier];
    for (const zone of zones) {
      await expect(zone).toBeVisible();
    }
    const rectangles = await Promise.all(
      zones.map((zone) => zone.boundingBox()),
    );
    const [
      presentationBounds,
      identiteBounds,
      avancementBounds,
      calendrierBounds,
    ] = rectangles;
    expect(presentationBounds).not.toBeNull();
    expect(identiteBounds).not.toBeNull();
    expect(avancementBounds).not.toBeNull();
    expect(calendrierBounds).not.toBeNull();
    if (
      !presentationBounds ||
      !identiteBounds ||
      !avancementBounds ||
      !calendrierBounds
    ) {
      throw new Error(
        "Les quatre zones de la synthèse doivent être affichées.",
      );
    }

    expect(identiteBounds.y).toBeGreaterThanOrEqual(
      presentationBounds.y + presentationBounds.height,
    );
    expect(avancementBounds.y).toBeGreaterThanOrEqual(
      identiteBounds.y + identiteBounds.height,
    );
    if (viewport.width === 1440) {
      expect(calendrierBounds.x).toBeGreaterThanOrEqual(
        presentationBounds.x + presentationBounds.width,
      );
      expect(
        Math.abs(calendrierBounds.y - presentationBounds.y),
      ).toBeLessThanOrEqual(1);
    } else {
      expect(calendrierBounds.y).toBeGreaterThanOrEqual(
        avancementBounds.y + avancementBounds.height,
      );
      expect(
        Math.abs(calendrierBounds.x - presentationBounds.x),
      ).toBeLessThanOrEqual(1);
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.body.scrollWidth <= document.documentElement.clientWidth &&
            document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  });
}

for (const projectPath of [`/projets/${DOSSIER_NUMBER}`, "/projets/demo"]) {
  test(`le lecteur accède au financement depuis la synthèse ${projectPath}`, async ({
    page,
  }) => {
    await page.goto(projectPath);

    await expect(
      page.getByRole("region", { name: "Aide du Fonds vert" }),
    ).not.toBeAttached();
    await expect(
      page.getByRole("region", { name: /Engagement juridique n°/ }),
    ).not.toBeAttached();

    const financementLink = page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Financement", exact: true });
    await expect(financementLink).toHaveAttribute(
      "href",
      `${projectPath}/financement`,
    );
    await financementLink.click();

    await expect(page).toHaveURL(`${projectPath}/financement`);
    await expect(financementLink).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      PROJECT_TITLE,
    );
    await expect(
      page.getByRole("heading", { level: 2, name: "Financement du projet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "Aide du Fonds vert" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Engagement juridique n°2105212345",
      }),
    ).toBeVisible();
  });
}

test("le lecteur consulte les montants du projet et de sa subvention sur la page Financement", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);

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

test("le lecteur parcourt les trois onglets d’un engagement au clavier sans changer l’autre engagement", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
  await waitForDsfrTabs(page);

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

  const informationsTab = engagement1.getByRole("tab", {
    name: "Informations",
  });
  const historiqueTab = engagement1.getByRole("tab", { name: "Historique" });
  const contactTab = engagement1.getByRole("tab", { name: "Contact" });
  await informationsTab.focus();
  await expect(informationsTab).toHaveAttribute("aria-selected", "true");

  await informationsTab.press("ArrowRight");
  await expect(historiqueTab).toBeFocused();
  await expect(historiqueTab).toHaveAttribute("aria-selected", "true");
  await expect(
    engagement1.getByRole("tabpanel", { name: "Historique" }),
  ).toBeVisible();
  await expect(informationsTab).toHaveAttribute("aria-selected", "false");

  await historiqueTab.press("ArrowRight");
  await expect(contactTab).toBeFocused();
  await expect(contactTab).toHaveAttribute("aria-selected", "true");
  await expect(
    engagement1.getByRole("tabpanel", { name: "Contact" }),
  ).toBeVisible();
  await expect(
    engagement1.getByRole("tabpanel", { name: "Contact" }),
  ).toContainText("Voir les informations dans votre convention / arrêté.");
  await expect(
    engagement1.getByRole("tabpanel", { name: "Historique" }),
  ).toBeHidden();

  await contactTab.press("ArrowRight");
  await expect(informationsTab).toBeFocused();
  await expect(informationsTab).toHaveAttribute("aria-selected", "true");
  await expect(
    engagement1.getByRole("tabpanel", { name: "Informations" }),
  ).toBeVisible();
  await expect(
    engagement2.getByRole("tab", { name: "Informations" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    engagement2.getByRole("tabpanel", { name: "Informations" }),
  ).toBeVisible();
});

test("le lecteur retrouve les montants, le fournisseur et le dernier paiement dans Informations", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
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
  await expect(engagement1.getByLabel("Date de paiement")).toContainText(
    "7 octobre 2024",
  );
  await expect(engagement1.getByLabel("Numéro de demande")).toHaveText(
    "1001234567",
  );
});

test("le lecteur consulte l’historique annuel d’un engagement et ses années sans paiement", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
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

test("le lecteur consulte séparément chaque demande de paiement, de la plus récente à la plus ancienne", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
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
  await expect(engagement.getByLabel("Numéro de demande")).toHaveText(
    "1009876546",
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

test("le lecteur distingue un engagement sans aucun paiement d’un engagement déjà payé", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`, () =>
      HttpResponse.json({
        data: {
          ...fondsVertDossierData.data,
          information_financiere: {
            informations_engagement:
              fondsVertDossierData.data.information_financiere!.informations_engagement.map(
                (annee) => {
                  const engagements = annee.engagements_juridiques.map(
                    (engagement) => ({
                      ...engagement,
                      demandes_paiement:
                        engagement.numero_ej === "2105212345"
                          ? []
                          : engagement.demandes_paiement,
                    }),
                  );

                  return {
                    ...annee,
                    engagements_juridiques: engagements,
                    montant_paye_per_dossier: engagements
                      .flatMap((engagement) => engagement.demandes_paiement)
                      .reduce(
                        (total, paiement) => total + paiement.montant_paye,
                        0,
                      ),
                  };
                },
              ),
          },
        },
      }),
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
  await waitForDsfrTabs(page);

  const engagementSansPaiement = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(
    engagementSansPaiement.getByText("Aucun paiement n'a été réalisé."),
  ).toBeVisible();
  await expect(
    engagementSansPaiement.getByLabel("Dernier paiement"),
  ).not.toBeAttached();
  await expect(
    engagementSansPaiement.getByLabel("Date de paiement"),
  ).not.toBeAttached();
  await expect(
    engagementSansPaiement.getByLabel("Numéro de demande"),
  ).not.toBeAttached();
  await expect(
    engagementSansPaiement.getByLabel("Montant restant"),
  ).toContainText("6 651 494,80 €");

  await engagementSansPaiement.getByRole("tab", { name: "Historique" }).click();
  const lignesSansPaiement = engagementSansPaiement.getByRole("row");
  await expect(lignesSansPaiement).toHaveCount(4);
  for (const index of [1, 2, 3]) {
    const cellules = lignesSansPaiement.nth(index).getByRole("cell");
    await expect(cellules.nth(2)).toHaveText("Aucun paiement");
    await expect(cellules.nth(3)).toHaveText("—");
    await expect(cellules.nth(4)).toHaveText("—");
  }

  const engagementPaye = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });
  await expect(engagementPaye.getByLabel("Dernier paiement")).toContainText(
    "200 000,00 €",
  );
  await expect(engagementPaye.getByLabel("Numéro de demande")).toHaveText(
    "1009876546",
  );
});

test("le lecteur mobile lit entièrement les fournisseurs et centres de coût multiples très longs", async ({
  page,
  msw,
}) => {
  const fournisseurs = [
    "Communauté de communes des vallées et des plateaux pour la rénovation énergétique des bâtiments publics et des équipements scolaires intercommunaux",
    "Syndicat mixte départemental de coordination des travaux de transition écologique et de modernisation des infrastructures territoriales",
  ];
  const centresCouts = [
    "CENTRECOUTSRENOVATIONENERGETIQUEBATIMENTSPUBLICSDEPARTEMENTAUXETINTERCOMMUNAUX000000001",
    "CENTRECOUTSTRANSITIONECOLOGIQUEEQUIPEMENTSSCOLAIRESETINFRASTRUCTURESTERRITORIALES000000002",
  ];
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/finances/2106789012", () =>
      HttpResponse.json({
        ...fondsVertFinancesEJ2Data,
        data: {
          ...fondsVertFinancesEJ2Data.data,
          annees_informations_financieres:
            fondsVertFinancesEJ2Data.data.annees_informations_financieres.map(
              (annee) => ({
                ...annee,
                postes: annee.postes.map((poste, index) => ({
                  ...poste,
                  fournisseur_titulaire_nom: fournisseurs[index],
                  centre_couts: centresCouts[index],
                })),
              }),
            ),
        },
      }),
    ),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });
  for (const [label, valeurs] of [
    ["Fournisseurs", fournisseurs],
    ["Centres de coût", centresCouts],
  ] as const) {
    const champ = engagement.getByLabel(label, { exact: true });
    await expect(champ).toHaveText(valeurs.join(", "));
    await expect(champ).toBeVisible();
    await expect(champ).not.toHaveAttribute("title");
    await expect
      .poll(() =>
        champ.evaluate((element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return (
            style.whiteSpace !== "nowrap" &&
            style.textOverflow !== "ellipsis" &&
            element.scrollWidth <= element.clientWidth + 1 &&
            element.scrollHeight <= element.clientHeight + 1 &&
            bounds.left >= 0 &&
            bounds.right <= window.innerWidth
          );
        }),
      )
      .toBe(true);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("le lecteur mobile parcourt les cinq colonnes de l’historique dans le tableau sans élargir la page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
  await waitForDsfrTabs(page);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });
  await engagement.getByRole("tab", { name: "Historique" }).click();
  const historique = engagement.getByRole("tabpanel", { name: "Historique" });
  await expect(historique.getByRole("columnheader")).toHaveText([
    "Année",
    "Montant engagé",
    "Montant payé",
    "Date de demande",
    "Numéro de demande",
  ]);
  await expect(historique.getByRole("row")).toHaveCount(5);

  const defilementTableau = historique.locator(".fr-table__container");
  await expect
    .poll(() =>
      defilementTableau.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    )
    .toBe(true);
  await defilementTableau.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect
    .poll(() => defilementTableau.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);

  const dernierNumero = historique
    .getByRole("row")
    .nth(1)
    .getByRole("cell")
    .nth(4);
  await expect(dernierNumero).toHaveText("1009876546");
  await expect
    .poll(() =>
      dernierNumero.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const container = element
          .closest(".fr-table__container")
          ?.getBoundingClientRect();
        return Boolean(
          container &&
            bounds.left >= container.left - 1 &&
            bounds.right <= container.right + 1,
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.body.scrollWidth <= document.documentElement.clientWidth &&
          document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("dossier page displays impact metrics correctly", async ({ page }) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/impact`);

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
  ).toHaveCount(0);
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
    await page.goto(`/projets/${correctionDossierNumber}/impact`);
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
    await page.goto(`/projets/${correctionDossierNumber}/impact`);
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

    await waitForDsfrModal(page);
    await metricCard.getByRole("button", { name: "Modifier" }).click();
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("status").filter({ hasText: "Correction enregistrée" }),
    ).toHaveCount(0);
    await expect(
      getDossierMetricRevisionTargets({
        numeroDossier: correctionDossierNumber,
      }),
    ).resolves.toMatchObject({
      persistent_metric: { revision: 2, effectiveValue: 12.5 },
    });
  } finally {
    await deleteStoredDossierMetrics(correctionDossierNumber);
  }
});

test("refreshes a conflicting correction without replaying the discarded entry", async ({
  page,
  msw,
}) => {
  const dossierNumber = 89000032;
  await deleteStoredDossierMetrics(dossierNumber);
  msw.use(
    ds.query("getDossier", () =>
      HttpResponse.json(makeDossierDataWithNumber(dossierNumber)),
    ),
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${dossierNumber}`, () =>
      HttpResponse.json(fondsVertDossierData),
    ),
  );
  await importStoredDossierMetricsIfMissing({
    dossierNumber,
    metrics: {
      conflict_metric: {
        label: "Métrique partagée",
        unite: "ha",
        valeur_estimee: 10,
      },
    },
  });

  try {
    await page.goto(`/projets/${dossierNumber}/impact`);
    await waitForDsfrModal(page);
    const card = page.getByRole("region", { name: "Métrique partagée" });
    await card.getByRole("button", { name: "Modifier" }).click();
    const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    const input = dialog.getByLabel("Métrique partagée");
    await input.fill("14");

    await appendDossierMetricRevision({
      numeroDossier: dossierNumber,
      metricCode: "conflict_metric",
      value: 12,
      expectedRevision: 1,
      authorEmail: "autre-instructeur@example.com",
    });

    const submittedRevisions: number[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/metrics/conflict_metric")) {
        submittedRevisions.push(request.postDataJSON().expectedRevision);
      }
    });
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();

    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/La valeur actuelle a été chargée/),
    ).toBeVisible();
    await expect(input).toHaveValue("12");
    await expect(input).toBeFocused();
    await expect(card.getByLabel("Valeur effective")).toHaveText(/12\s*ha/);
    await expect(
      page.getByRole("status").filter({ hasText: "Correction enregistrée" }),
    ).toHaveCount(0);
    expect(submittedRevisions).toEqual([1]);
    await expect(
      getDossierMetricRevisionTargets({ numeroDossier: dossierNumber }),
    ).resolves.toMatchObject({
      conflict_metric: { revision: 2, effectiveValue: 12 },
    });

    await input.press("Tab");
    const saveButton = dialog.getByRole("button", {
      name: "Enregistrer",
      exact: true,
    });
    await expect(saveButton).toBeFocused();
    await saveButton.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card.getByRole("button", { name: "Modifier" })).toBeFocused();
    await card.getByRole("button", { name: "Modifier" }).press("Enter");
    await expect(input).toHaveValue("12");
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
    await expect(card.getByRole("button", { name: "Modifier" })).toBeFocused();
    await card.getByRole("button", { name: "Modifier" }).press("Enter");

    await input.fill("15");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    expect(submittedRevisions).toEqual([1, 2]);
    await expect(card.getByRole("button", { name: "Modifier" })).toBeFocused();
    await page.reload();
    await expect(card.getByLabel("Valeur effective")).toHaveText(/15\s*ha/);
    await expect(
      getDossierMetricRevisionTargets({ numeroDossier: dossierNumber }),
    ).resolves.toMatchObject({
      conflict_metric: { revision: 3, effectiveValue: 15 },
    });
  } finally {
    await deleteStoredDossierMetrics(dossierNumber);
  }
});

test("persists successive metric corrections by an ordinary porteur and instructeur from the project list", async ({
  page,
  msw,
}) => {
  const dossierNumber = 89000033;
  const porteurEmail = "porteur.metrics.ui@example.com";
  const instructeurEmail = "instructeur.metrics.ui@example.com";
  const dossier = {
    ...makeDossierDataWithNumber(dossierNumber).data.dossier,
    usager: { email: porteurEmail },
    groupeInstructeur: { instructeurs: [{ email: instructeurEmail }] },
  };
  msw.use(
    ds.query("getDossier", () => HttpResponse.json({ data: { dossier } })),
    ds.query("getDossierAccess", () =>
      HttpResponse.json({
        data: {
          dossier: {
            demandeur: dossier.demandeur,
            usager: dossier.usager,
            groupeInstructeur: dossier.groupeInstructeur,
          },
        },
      }),
    ),
    http.get("http://fondsvert/fonds_vert/v2/dossiers", () =>
      HttpResponse.json({
        count: 1,
        next_page: null,
        previous_page: null,
        data: [{ socle_commun: { dossier_number: dossierNumber } }],
      }),
    ),
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${dossierNumber}`, () =>
      HttpResponse.json(fondsVertDossierData),
    ),
  );
  await deleteStoredDossierMetrics(dossierNumber);
  await importStoredDossierMetricsIfMissing({
    dossierNumber,
    metrics: {
      shared_metric: {
        label: "Métrique des deux acteurs",
        unite: "ha",
        valeur_estimee: 10,
      },
    },
  });

  try {
    await authenticatePage(page, { email: porteurEmail });
    await page.goto("/projets");
    await page
      .getByRole("row")
      .filter({ hasText: String(dossierNumber) })
      .getByRole("link", { name: "Ouvrir" })
      .click();
    await page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Données d’impact", exact: true })
      .click();
    await waitForDsfrModal(page);
    const card = page.getByRole("region", {
      name: "Métrique des deux acteurs",
    });
    await card.getByRole("button", { name: "Modifier", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Métrique des deux acteurs").fill("12");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(card.getByLabel("Valeur effective")).toHaveText(/12\s*ha/);

    await page.context().clearCookies();
    await authenticatePage(page, { email: instructeurEmail });
    await page.goto("/projets");
    await page
      .getByRole("row")
      .filter({ hasText: String(dossierNumber) })
      .getByRole("link", { name: "Ouvrir" })
      .click();
    await page
      .getByRole("navigation", { name: "Pages du projet" })
      .getByRole("link", { name: "Données d’impact", exact: true })
      .click();
    await expect(card.getByLabel("Valeur effective")).toHaveText(/12\s*ha/);
    await waitForDsfrModal(page);
    await card.getByRole("button", { name: "Modifier", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
    await dialog.getByLabel("Métrique des deux acteurs").fill("15");
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(card.getByLabel("Valeur effective")).toHaveText(/15\s*ha/);

    const sql = createTestDatabaseClient();
    try {
      expect(
        await sql`select revision, number_value::float8 as value, author_email, created_at
        from dossier_metric_revisions where dossier_number=${dossierNumber} and metric_code='shared_metric' order by revision`,
      ).toEqual([
        {
          revision: 1,
          value: 10,
          author_email: null,
          created_at: expect.any(Date),
        },
        {
          revision: 2,
          value: 12,
          author_email: porteurEmail,
          created_at: expect.any(Date),
        },
        {
          revision: 3,
          value: 15,
          author_email: instructeurEmail,
          created_at: expect.any(Date),
        },
      ]);
    } finally {
      await sql.end();
    }
  } finally {
    await deleteStoredDossierMetrics(dossierNumber);
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
    await page.goto(`/projets/${correctionDossierNumber}/impact`);
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
    await page.goto(`/projets/${correctionDossierNumber}/impact`);
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
      page.getByRole("button", { name: "Modifier", exact: true }),
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

test("navigation links work correctly", async ({ page }) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(
    page.locator('[data-testid="breadcrumb-current"] ol > li:first-child > a'),
  ).toHaveAttribute("href", "/");

  const backLink = "/projets";

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
      engagementJuridique.getByLabel("Montant attribué initial"),
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

for (const [situation, serviceIndisponible] of [
  ["le socle Fonds vert est absent", false],
  ["Fonds vert est indisponible", true],
] as const) {
  test(`le lecteur conserve les quatre jalons et les données DN quand ${situation} et que le département n’est pas renseigné`, async ({
    page,
    msw,
  }) => {
    const siretDemandeurDN = "44455566600077";
    const champsSansDepartement = getDossierData.data.dossier.champs.map(
      (champ) =>
        champ.champDescriptorId === "Q2hhbXAtMzM0ODkyMw=="
          ? { ...champ, stringValue: "" }
          : champ,
    );
    msw.use(
      ds.query("getDossier", () =>
        HttpResponse.json({
          data: {
            dossier: {
              ...getDossierData.data.dossier,
              champs: champsSansDepartement,
              demandeur: {
                ...getDossierData.data.dossier.demandeur,
                siret: siretDemandeurDN,
              },
            },
          },
        }),
      ),
      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () =>
          serviceIndisponible
            ? HttpResponse.json({ error: "Server Error" }, { status: 503 })
            : HttpResponse.json({
                data: {
                  ...fondsVertDossierData.data,
                  socle_commun: undefined,
                },
              }),
      ),
    );

    await page.goto(`/projets/${DOSSIER_NUMBER}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      PROJECT_TITLE,
    );
    const presentation = page.getByRole("region", {
      name: "Présentation du projet",
    });
    await expect(presentation).toContainText(PROJECT_SUMMARY);
    await expect(
      presentation.getByLabel("Département d'implantation"),
    ).toHaveText("Aucun département précisé");
    await expect(
      presentation.getByLabel("Commune principale impactée"),
    ).toHaveText("Non renseignée");
    await expect(presentation.getByText(AGENCE_EAU_NUMBER)).toBeVisible();

    const identite = page.getByRole("region", {
      name: "Identité du porteur de projet",
    });
    await expect(identite.getByLabel("Nom du porteur")).toHaveText(
      "Non renseigné",
    );
    await expect(identite.getByLabel("SIRET")).toHaveText(siretDemandeurDN);
    await expect(
      identite.getByRole("link", {
        name: LEGAL_REPRESENTATIVE_EMAIL,
        exact: true,
      }),
    ).toHaveAttribute("href", `mailto:${LEGAL_REPRESENTATIVE_EMAIL}`);
    await expect(
      identite.getByRole("link", { name: CONTACT_EMAIL, exact: true }),
    ).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);

    const calendrier = page.getByRole("region", { name: "Calendrier" });
    const jalons = calendrier.getByRole("listitem");
    await expect(jalons).toHaveCount(4);
    for (const [index, libelle] of [
      "Dépôt du dossier",
      "Notification",
      "Début d'exécution",
      "Fin d'exécution",
    ].entries()) {
      await expect(jalons.nth(index)).toContainText(libelle);
      await expect(
        jalons.nth(index).getByText("Date non renseignée", { exact: true }),
      ).toBeVisible();
    }
  });
}

test("le lecteur conserve les quatre jalons et les données DN quand les dates Fonds vert sont invalides", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`, () =>
      HttpResponse.json({
        data: {
          ...fondsVertDossierData.data,
          socle_commun: {
            ...fondsVertDossierData.data.socle_commun,
            date_depot: "date inconnue",
            date_notification: "2024-99-99",
            date_debut_execution: "date à confirmer",
            date_fin_execution: "2099-14-45",
          },
        },
      }),
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  const calendrier = page.getByRole("region", { name: "Calendrier" });
  const jalons = calendrier.getByRole("listitem");
  await expect(jalons).toHaveCount(4);
  for (const [index, libelle] of [
    "Dépôt du dossier",
    "Notification",
    "Début d'exécution",
    "Fin d'exécution",
  ].entries()) {
    await expect(jalons.nth(index)).toContainText(libelle);
    await expect(
      jalons.nth(index).getByText("Date non renseignée", { exact: true }),
    ).toBeVisible();
  }

  const presentation = page.getByRole("region", {
    name: "Présentation du projet",
  });
  await expect(presentation).toContainText(PROJECT_SUMMARY);
  await expect(
    presentation.getByLabel("Département d'implantation"),
  ).toHaveText(DEPARTMENT);
  const identite = page.getByRole("region", {
    name: "Identité du porteur de projet",
  });
  await expect(
    identite.getByRole("link", { name: LEGAL_REPRESENTATIVE_EMAIL }),
  ).toBeVisible();
  await expect(
    identite.getByRole("link", { name: CONTACT_EMAIL }),
  ).toBeVisible();
});

test("dossier page removes the external impact form and invitation", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);
  await expect(
    page
      .getByRole("region", { name: "Avancement du projet" })
      .getByText("Non renseigné"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Mettre à jour les données" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", {
      name: "Les données de votre projet participent à la transition écologique",
    }),
  ).toHaveCount(0);
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

test.describe("consultation d’un dossier par un porteur ordinaire", () => {
  const emailPorteur = "porteur-dossier@example.test";
  const cheminProjet = `/projets/${DOSSIER_NUMBER}`;
  const cheminFinancement = `${cheminProjet}/financement`;

  test.beforeEach(async ({ page, msw }) => {
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") ?? [];
    expect(adminEmails.includes(emailPorteur)).toBe(false);
    await authenticatePage(page, {
      email: emailPorteur,
      projectView: "porteur",
    });

    const dossierPorteur = {
      ...getDossierData.data.dossier,
      usager: { ...getDossierData.data.dossier.usager, email: emailPorteur },
    };
    msw.use(
      ds.query("getDossier", () =>
        HttpResponse.json({ data: { dossier: dossierPorteur } }),
      ),
      ds.query("getDossierAccess", () => {
        const { demandeur, groupeInstructeur, usager } = dossierPorteur;
        return HttpResponse.json({
          data: { dossier: { demandeur, groupeInstructeur, usager } },
        });
      }),
    );
  });

  test("le porteur distingue le total payé inconnu des montants connus sans informations financières", async ({
    page,
    msw,
  }) => {
    msw.use(
      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () =>
          HttpResponse.json({
            data: {
              ...fondsVertDossierData.data,
              information_financiere: undefined,
            },
          }),
      ),
    );

    await page.goto(cheminFinancement);

    const financement = page.getByRole("region", {
      name: "Financement du projet",
      exact: true,
    });
    await expect(
      financement.getByLabel("Montant total des dépenses du projet"),
    ).toHaveText("18 939 933,00 €");
    const aide = financement.getByRole("region", {
      name: "Aide du Fonds vert",
    });
    await expect(
      aide.getByLabel("Montant attribué", { exact: true }),
    ).toHaveText("10 073 564,00 €");
    await expect(aide.getByLabel("Montant total payé")).toHaveText("N/A");
    await expect(
      financement.getByRole("region", { name: /Engagement juridique n°/ }),
    ).toHaveCount(0);

    const navigation = page.getByRole("navigation", {
      name: "Pages du projet",
    });
    await expect(navigation.getByRole("link")).toHaveText([
      "Synthèse du projet",
      "Données d’impact",
      "Financement",
    ]);
    await expect(
      navigation.getByRole("link", { name: "Synthèse du projet", exact: true }),
    ).toHaveAttribute("href", cheminProjet);
    await expect(
      navigation.getByRole("link", { name: "Données d’impact", exact: true }),
    ).toHaveAttribute("href", `${cheminProjet}/impact`);
    await expect(
      navigation.getByRole("link", { name: "Financement", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("le porteur conserve le financement et sa navigation après une panne globale de Fonds vert et un rechargement", async ({
    page,
    msw,
  }) => {
    msw.use(
      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () =>
          HttpResponse.json({ error: "Service Unavailable" }, { status: 503 }),
      ),
    );

    await page.goto(cheminFinancement);

    const financement = page.getByRole("region", {
      name: "Financement du projet",
      exact: true,
    });
    await expect(
      financement.getByText(
        "L'historique financier est temporairement indisponible.",
        {
          exact: true,
        },
      ),
    ).toBeVisible();
    for (const libelle of [
      "Montant total des dépenses du projet",
      "Montant attribué",
      "Montant total payé",
    ]) {
      await expect(financement.getByLabel(libelle, { exact: true })).toHaveText(
        "N/A",
      );
    }
    await expect(financement).not.toContainText(/0,00\s*€/);
    await expect(
      financement.getByRole("region", { name: /Engagement juridique n°/ }),
    ).toHaveCount(0);
    const navigation = page.getByRole("navigation", {
      name: "Pages du projet",
    });
    await expect(navigation.getByRole("link")).toHaveText([
      "Synthèse du projet",
      "Données d’impact",
      "Financement",
    ]);

    await page.reload();

    await expect(page).toHaveURL(cheminFinancement);
    await expect(
      financement.getByText(
        "L'historique financier est temporairement indisponible.",
        {
          exact: true,
        },
      ),
    ).toBeVisible();
    for (const libelle of [
      "Montant total des dépenses du projet",
      "Montant attribué",
      "Montant total payé",
    ]) {
      await expect(financement.getByLabel(libelle, { exact: true })).toHaveText(
        "N/A",
      );
    }
    await expect(
      navigation.getByRole("link", { name: "Financement", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    const lienProjet = page
      .getByTestId("breadcrumb-current")
      .getByRole("link", { name: `Projet n°${DOSSIER_NUMBER}`, exact: true });
    await expect(lienProjet).toHaveAttribute("href", cheminProjet);
    await lienProjet.click();

    await expect(page).toHaveURL(cheminProjet);
    await expect(
      page.getByRole("region", { name: "Synthèse du projet", exact: true }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "Synthèse du projet", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("le porteur consulte les trois pages du dossier sur ordinateur puis la synthèse sur mobile et en conserve les captures", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(cheminProjet);
    await waitForDsfrModal(page);

    const synthese = page.getByRole("region", {
      name: "Synthèse du projet",
      exact: true,
    });
    await expect(
      synthese.getByRole("region", { name: "Présentation du projet" }),
    ).toContainText(PROJECT_SUMMARY);
    await expect(
      synthese.getByRole("region", { name: "Identité du porteur de projet" }),
    ).toBeVisible();
    await expect(
      synthese.getByRole("region", { name: "Avancement du projet" }),
    ).toBeVisible();
    await expect(
      synthese.getByRole("region", { name: "Calendrier" }),
    ).toBeVisible();
    await expect(
      synthese.getByRole("button", {
        name: "Modifier l’avancement",
        exact: true,
      }),
    ).toBeEnabled();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.screenshot({
      path: testInfo.outputPath("synthese-desktop.png"),
      fullPage: true,
    });

    const navigation = page.getByRole("navigation", {
      name: "Pages du projet",
    });
    await navigation
      .getByRole("link", { name: "Données d’impact", exact: true })
      .click();
    await expect(page).toHaveURL(`${cheminProjet}/impact`);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Données d’impact",
        exact: true,
      }),
    ).toBeVisible();
    const consommation = page.getByRole("region", {
      name: "Consommation énergétique",
      exact: true,
    });
    await expect(consommation).toBeVisible();
    await expect(consommation.getByTestId("valeur-0")).toContainText(
      "2 055 650",
    );
    await expect(consommation.getByTestId("valeur-1")).toContainText(
      "1 935 960",
    );
    await page.screenshot({
      path: testInfo.outputPath("impact-desktop.png"),
      fullPage: true,
    });

    await navigation
      .getByRole("link", { name: "Financement", exact: true })
      .click();
    await expect(page).toHaveURL(cheminFinancement);
    await waitForDsfrTabs(page);
    await expect(
      page.getByRole("region", { name: "Aide du Fonds vert" }),
    ).toBeVisible();
    const engagements = page.getByRole("region", {
      name: /Engagement juridique n°/,
    });
    await expect(engagements).toHaveCount(2);
    await expect(
      engagements.nth(0).getByLabel("Montant attribué initial"),
    ).toContainText("10 073 574,00 €");
    await expect(
      engagements.nth(1).getByLabel("Montant attribué initial"),
    ).toContainText("2 500 000,00 €");
    await page.screenshot({
      path: testInfo.outputPath("financement-desktop.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await navigation
      .getByRole("link", { name: "Synthèse du projet", exact: true })
      .click();
    await expect(page).toHaveURL(cheminProjet);
    for (const nom of [
      "Présentation du projet",
      "Identité du porteur de projet",
      "Avancement du projet",
      "Calendrier",
    ]) {
      await expect(synthese.getByRole("region", { name: nom })).toBeVisible();
    }
    await page.screenshot({
      path: testInfo.outputPath("synthese-mobile.png"),
      fullPage: true,
    });
  });
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

  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);

  await expect(page.getByText("Introuvable")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Aide du Fonds vert" }),
  ).not.toBeAttached();
  await expect(
    page.getByRole("region", { name: /Engagement juridique/ }),
  ).not.toBeAttached();
});

test("le lecteur conserve les montants disponibles quand les détails de tous les engagements échouent", async ({
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

  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);

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

test("le lecteur conserve un engagement complet quand les détails de l’autre échouent", async ({
  page,
  msw,
}) => {
  msw.use(
    http.get("http://fondsvert/fonds_vert/v2/finances/2105212345", () =>
      HttpResponse.json({ error: "Server Error" }, { status: 500 }),
    ),
  );

  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
  await waitForDsfrTabs(page);

  await expect(
    page.getByText(
      "Les détails des engagements juridiques (montant attribué initial, fournisseur, centre de coût) sont temporairement indisponibles.",
    ),
  ).toBeVisible();
  const engagementIncomplet = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });
  await expect(
    engagementIncomplet.getByLabel("Montant attribué initial"),
  ).not.toBeAttached();
  await expect(
    engagementIncomplet.getByLabel("Fournisseur"),
  ).not.toBeAttached();
  await expect(
    engagementIncomplet.getByLabel("Centre de coût"),
  ).not.toBeAttached();
  await expect(
    engagementIncomplet.getByLabel("Montant attribué en 2025"),
  ).toContainText("6 651 494,80 €");
  await expect(
    engagementIncomplet.getByLabel("Dernier paiement"),
  ).toContainText("3 422 079,20 €");

  const engagementComplet = page.getByRole("region", {
    name: "Engagement juridique n°2106789012",
  });
  await expect(
    engagementComplet.getByLabel("Montant attribué initial"),
  ).toContainText("2 500 000,00 €");
  await expect(
    engagementComplet.getByLabel("Montant attribué en 2025"),
  ).toContainText("500 000,00 €");
  await expect(engagementComplet.getByLabel("Montant restant")).toContainText(
    "300 000,00 €",
  );
  await expect(engagementComplet.getByLabel("Fournisseur")).toHaveText(
    COMPANY_NAME,
  );
  await expect(engagementComplet.getByLabel("Centres de coût")).toHaveText(
    `${CENTRE_COUTS_2C}, ${CENTRE_COUTS_2D}`,
  );
  await expect(engagementComplet.getByLabel("Dernier paiement")).toContainText(
    "200 000,00 €",
  );
  await expect(engagementComplet.getByLabel("Date de paiement")).toContainText(
    "10 février 2025",
  );
  await expect(engagementComplet.getByLabel("Numéro de demande")).toHaveText(
    "1009876546",
  );

  await engagementComplet.getByRole("tab", { name: "Historique" }).click();
  await expect(engagementComplet.getByRole("row")).toHaveCount(5);
  await expect(
    engagementComplet.getByRole("row").nth(1).getByRole("cell").nth(4),
  ).toHaveText("1009876546");
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`le lecteur lit le titre et le résumé longs en entier à ${viewport.width} px`, async ({
    page,
    msw,
  }) => {
    const resumeLong =
      "La rénovation du complexe sportif prévoit une isolation complète des façades, le remplacement des équipements de chauffage et la réfection des vestiaires pour améliorer les conditions d’accueil des associations et des écoles. ".repeat(
        4,
      ) +
      "La dernière phase prévoit la remise en service de la piscine et des espaces accessibles au public.";
    const dossierAvecTitreLong =
      makeDossierDataWithTitle(PROJECT_TITLE_LONG).data.dossier;
    msw.use(
      ds.query("getDossier", () =>
        HttpResponse.json({
          data: {
            dossier: {
              ...dossierAvecTitreLong,
              champs: dossierAvecTitreLong.champs.map((champ) =>
                champ.champDescriptorId === "Q2hhbXAtMjk5Nzg3Mw=="
                  ? { ...champ, stringValue: resumeLong }
                  : champ,
              ),
            },
          },
        }),
      ),
    );

    await page.setViewportSize(viewport);
    await page.goto(`/projets/${DOSSIER_NUMBER}`);

    const titre = page.getByRole("heading", { level: 1 });
    await expect(titre).toHaveText(PROJECT_TITLE_LONG);
    const resume = page
      .getByRole("region", { name: "Présentation du projet" })
      .getByText(resumeLong, { exact: true });
    await expect(resume).toHaveText(resumeLong);
    await expect(resume).not.toHaveAttribute("title");
    for (const texte of [titre, resume]) {
      await expect(texte).toBeVisible();
      await expect
        .poll(() =>
          texte.evaluate((element) => {
            const style = getComputedStyle(element);
            const bounds = element.getBoundingClientRect();
            const contenu = document.createRange();
            contenu.selectNodeContents(element);
            const lignes = [...contenu.getClientRects()];
            const derniereLigne = lignes.at(-1);
            return (
              style.webkitLineClamp === "none" &&
              style.textOverflow !== "ellipsis" &&
              element.scrollWidth <= element.clientWidth + 1 &&
              derniereLigne !== undefined &&
              (style.overflowY === "visible" ||
                (element.scrollHeight <= element.clientHeight + 1 &&
                  derniereLigne.bottom <= bounds.bottom + 1)) &&
              bounds.left >= 0 &&
              bounds.right <= window.innerWidth
            );
          }),
        )
        .toBe(true);
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.body.scrollWidth <= document.documentElement.clientWidth &&
            document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  });
}

for (const [etatEngagement, statutAffiche] of [
  ["en cours", "En cours"],
  ["non démarré", "Non démarré"],
  ["soldé", "Soldé"],
  ["clos", "Clos"],
  ["inconnu", "Inconnu"],
  ["sans paiement", "Sans paiement"],
] as const) {
  test(`le lecteur voit le statut « ${statutAffiche} » de son engagement`, async ({
    page,
    msw,
  }) => {
    msw.use(
      http.get(
        `http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER_NUMBER}`,
        () =>
          HttpResponse.json({
            data: {
              ...fondsVertDossierData.data,
              information_financiere: {
                informations_engagement:
                  fondsVertDossierData.data.information_financiere!.informations_engagement.map(
                    (annee) => ({
                      ...annee,
                      etat_engagement: etatEngagement,
                    }),
                  ),
              },
            },
          }),
      ),
    );

    await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);

    const engagement = page.getByRole("region", {
      name: "Engagement juridique n°2105212345",
    });
    await expect(
      engagement.getByText("Statut des paiements de la subvention"),
    ).toBeVisible();
    await expect(
      engagement.getByText(statutAffiche, { exact: true }),
    ).toBeVisible();
  });
}

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

  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);

  const engagement = page.getByRole("region", {
    name: "Engagement juridique n°2105212345",
  });

  await expect(engagement).toBeVisible();
  await expect(
    engagement.getByText("Statut des paiements de la subvention"),
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
