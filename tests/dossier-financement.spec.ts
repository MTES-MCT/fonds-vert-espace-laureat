import {
  expect,
  http,
  HttpResponse,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import { demoPoolDossier } from "@/utils/demo";

import {
  CENTRE_COUTS,
  CENTRE_COUTS_2C,
  CENTRE_COUTS_2D,
  COMPANY_NAME,
  PROGRAM_TITLE,
  PROJECT_TITLE,
} from "./fixtures/constants";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ2Data,
} from "./fixtures/fondsvert";
import { configureAdministratorDossierFixtures } from "./setup/dossier";

async function waitForDsfrTabs(page: Page) {
  await page.waitForSelector("[data-fr-js-tab-button]");
}
const DOSSIER_NUMBER = 89334001;
configureAdministratorDossierFixtures(DOSSIER_NUMBER);

for (const { projectPath, title, demo } of [
  {
    projectPath: `/projets/${DOSSIER_NUMBER}`,
    title: PROJECT_TITLE,
    demo: false,
  },
  {
    projectPath: `/projets/demo/${demoPoolDossier.numero}`,
    title: demoPoolDossier.champs.intituleProjet,
    demo: true,
  },
]) {
  test(`le lecteur accède au financement depuis la synthèse ${projectPath}`, async ({
    page,
  }) => {
    if (demo) {
      await page.goto("/projets/demo");
      await page.getByRole("link", { name: title, exact: true }).click();
    } else {
      await page.goto(projectPath);
    }

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
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
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

test("le parcours authentifié refuse le numéro de la piscine réservé à la démo", async ({
  page,
}) => {
  await page.goto(`/projets/${DOSSIER_NUMBER}/financement`);
  await expect(
    page.getByRole("heading", { name: PROJECT_TITLE }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Engagement juridique n°2105212345" }),
  ).toBeVisible();

  await page.goto(`/projets/${demoPoolDossier.numero}/financement`);
  await expect(page.getByText("Introuvable", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Engagement juridique/ }),
  ).toHaveCount(0);

  const response = await page.request.post(
    `/api/projets/${demoPoolDossier.numero}/progress`,
    {
      data: { status: "Bloqué", expectedRevision: 0 },
    },
  );
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: "Accès refusé à ce dossier" });
});

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
    engagement1.getByLabel("Montant attribué initial", { exact: true }),
  ).toContainText("10 073 574,00 €");
  await expect(
    engagement1.getByLabel("Montant attribué en 2025"),
  ).toContainText("6 651 494,80 €");
  await expect(engagement1.getByLabel("Montant restant")).toContainText(
    "6 651 494,80 €",
  );
  await expect(
    engagement1.getByLabel("Fournisseur", { exact: true }),
  ).toContainText(COMPANY_NAME);
  await expect(
    engagement1.getByLabel("Centre de coût", { exact: true }),
  ).toContainText(CENTRE_COUTS);
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

  await expect(
    engagement.getByLabel("Montant attribué initial", { exact: true }),
  ).toContainText("2 500 000,00 €");
  await expect(engagement.getByLabel("Montant attribué en 2025")).toContainText(
    "500 000,00 €",
  );
  await expect(engagement.getByLabel("Montant restant")).toContainText(
    "300 000,00 €",
  );
  await expect(
    engagement.getByLabel("Fournisseur", { exact: true }),
  ).toContainText(COMPANY_NAME);
  await expect(
    engagement.getByLabel("Centres de coût", { exact: true }),
  ).toContainText(`${CENTRE_COUTS_2C}, ${CENTRE_COUTS_2D}`);
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
    engagementSansPaiement.getByLabel("Dernier paiement"),
  ).toHaveText("Aucun paiement n'a été réalisé.");
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

  const defilementTableau = historique.getByRole("region", {
    name: "Historique des paiements",
  });
  await expect(
    engagement.getByRole("tabpanel", {
      name: "Informations",
      includeHidden: true,
    }),
  ).toBeHidden();
  await page.keyboard.press("Tab");
  await expect(historique).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(defilementTableau).toBeFocused();
  await expect
    .poll(() =>
      defilementTableau.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    )
    .toBe(true);
  for (let keyPress = 0; keyPress < 35; keyPress++) {
    await page.keyboard.press("ArrowRight");
  }
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
    engagementJuridique.getByLabel("Montant attribué initial", { exact: true }),
  ).not.toBeAttached();
  await expect(
    engagementJuridique.getByLabel("Fournisseur", { exact: true }),
  ).not.toBeAttached();
  await expect(
    engagementJuridique.getByLabel("Centre de coût", { exact: true }),
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
    engagementIncomplet.getByLabel("Montant attribué initial", { exact: true }),
  ).not.toBeAttached();
  await expect(
    engagementIncomplet.getByLabel("Fournisseur", { exact: true }),
  ).not.toBeAttached();
  await expect(
    engagementIncomplet.getByLabel("Centre de coût", { exact: true }),
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
    engagementComplet.getByLabel("Montant attribué initial", { exact: true }),
  ).toContainText("2 500 000,00 €");
  await expect(
    engagementComplet.getByLabel("Montant attribué en 2025"),
  ).toContainText("500 000,00 €");
  await expect(engagementComplet.getByLabel("Montant restant")).toContainText(
    "300 000,00 €",
  );
  await expect(
    engagementComplet.getByLabel("Fournisseur", { exact: true }),
  ).toHaveText(COMPANY_NAME);
  await expect(
    engagementComplet.getByLabel("Centres de coût", { exact: true }),
  ).toHaveText(`${CENTRE_COUTS_2C}, ${CENTRE_COUTS_2D}`);
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
