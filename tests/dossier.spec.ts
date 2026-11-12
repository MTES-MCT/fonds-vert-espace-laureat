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
  COMMUNE,
  COMPANY_NAME,
  CONTACT_EMAIL,
  DEPARTMENT,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
  PROJECT_TITLE_LONG,
  SIRET,
} from "./fixtures/constants";
import { makeDossierDataWithTitle } from "./fixtures/ds";
import { fondsVertDossierData } from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import { configureAdministratorDossierFixtures } from "./setup/dossier";

async function waitForDsfrTabs(page: Page) {
  await page.waitForSelector("[data-fr-js-tab-button]");
}

async function waitForDsfrModal(page: Page) {
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });
}
const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const DOSSIER_NUMBER = 12345678;
const dossierData = configureAdministratorDossierFixtures(DOSSIER_NUMBER);

test("dossier page displays project presentation correctly", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}`);

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    PROJECT_TITLE,
  );
  const projectSection = page.getByRole("region", {
    name: "Présentation du projet",
    exact: true,
  });
  await expect(
    projectSection.getByLabel("Numéro de dossier", { exact: true }),
  ).toHaveText(String(DOSSIER_NUMBER));
  await expect(
    projectSection.getByLabel("Dispositif", { exact: true }),
  ).toHaveText(PROGRAM_TITLE);
  await expect(
    projectSection.getByLabel("Édition", { exact: true }),
  ).toHaveText("2023");

  await expect(projectSection).toContainText(PROJECT_SUMMARY);
  await expect(
    projectSection.getByLabel("Département d'implantation"),
  ).toContainText(DEPARTMENT);
  await expect(
    projectSection.getByLabel("Commune principale impactée"),
  ).toContainText(COMMUNE);
  await expect(projectSection.getByText(AGENCE_EAU_NUMBER)).toBeVisible();
  await expect(projectSection.locator("dt")).toHaveText([
    "Numéro de dossier",
    "Dispositif",
    "Édition",
    "Département d'implantation",
    "Commune principale impactée",
    "Numéro de dossier agence de l'eau",
    "Avancement",
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
            ...dossierData.data.dossier,
            champs: dossierData.data.dossier.champs.map((champ) =>
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
    const avancement = presentation.getByTestId("project-progress-row");
    await expect(
      avancement.getByText("Avancement", { exact: true }),
    ).toBeVisible();
    await expect(
      avancement.getByRole("button", { name: "Modifier l’avancement" }),
    ).toBeVisible();

    const calendrier = page.getByRole("region", { name: "Calendrier" });
    const zones = [presentation, identite, calendrier];
    for (const zone of zones) {
      await expect(zone).toBeVisible();
    }
    const [presentationBounds, identiteBounds, calendrierBounds] =
      await Promise.all(zones.map((zone) => zone.boundingBox()));
    if (!presentationBounds || !identiteBounds || !calendrierBounds) {
      throw new Error("Les trois zones de la synthèse doivent être affichées.");
    }

    expect(identiteBounds.y).toBeGreaterThanOrEqual(
      presentationBounds.y + presentationBounds.height,
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
        identiteBounds.y + identiteBounds.height,
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

test("l’ancienne URL de demande de versement renvoie une page introuvable", async ({
  page,
}) => {
  const ancienneUrl = `/projets/${DOSSIER_NUMBER}/demande-de-versement`;
  const response = await page.goto(ancienneUrl);

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(ancienneUrl);
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

  const footerBack = page.getByRole("link", {
    name: "Revenir à la liste des projets",
    exact: true,
  });
  await expect(footerBack).toHaveAttribute("href", backLink);
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
    const champsSansDepartement = dossierData.data.dossier.champs.map(
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
              ...dossierData.data.dossier,
              champs: champsSansDepartement,
              demandeur: {
                ...dossierData.data.dossier.demandeur,
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
    page.getByTestId("project-progress-row").getByText("Non renseigné"),
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
      ...dossierData.data.dossier,
      usager: { ...dossierData.data.dossier.usager, email: emailPorteur },
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

  test("le porteur consulte les trois pages du dossier avec le calendrier sur ordinateur et mobile", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(cheminProjet);
    await waitForDsfrModal(page);
    const calendrier = page.getByRole("region", { name: "Calendrier" });
    const jalons = await calendrier.getByRole("listitem").allTextContents();
    expect(jalons).toHaveLength(4);

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
    await expect(synthese.getByTestId("project-progress-row")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Calendrier" }),
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
    for (const [label, value] of [
      ["Consommation énergétique avant travaux", "2 055 650"],
      ["Consommation énergétique après travaux", "1 935 960"],
    ]) {
      await expect(
        page
          .getByRole("region", { name: label, exact: true })
          .getByTestId("valeur-estimee"),
      ).toContainText(value);
    }
    await expect(calendrier).toBeVisible();
    await expect(calendrier.getByRole("listitem")).toHaveText(jalons);
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
      engagements
        .nth(0)
        .getByLabel("Montant attribué initial", { exact: true }),
    ).toContainText("10 073 574,00 €");
    await expect(
      engagements
        .nth(1)
        .getByLabel("Montant attribué initial", { exact: true }),
    ).toContainText("2 500 000,00 €");
    await expect(calendrier).toBeVisible();
    await expect(calendrier.getByRole("listitem")).toHaveText(jalons);
    await page.screenshot({
      path: testInfo.outputPath("financement-desktop.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    for (const [onglet, chemin, titre, capture] of [
      ["Synthèse du projet", cheminProjet, "Synthèse du projet", "synthese"],
      [
        "Données d’impact",
        `${cheminProjet}/impact`,
        "Données d’impact",
        "impact",
      ],
      [
        "Financement",
        cheminFinancement,
        "Financement du projet",
        "financement",
      ],
    ] as const) {
      await navigation.getByRole("link", { name: onglet, exact: true }).click();
      await expect(page).toHaveURL(chemin);
      await expect(calendrier).toBeVisible();
      await expect(calendrier.getByRole("listitem")).toHaveText(jalons);

      const contenu = page.getByRole("heading", { level: 2, name: titre });
      const basDuContenu = await contenu.evaluate(
        (heading) => heading.parentElement?.getBoundingClientRect().bottom,
      );
      const calendrierMobile = await calendrier.boundingBox();
      expect(calendrierMobile?.y).toBeGreaterThanOrEqual(
        basDuContenu ?? Infinity,
      );
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth === window.innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`${capture}-mobile.png`),
        fullPage: true,
      });
    }
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
