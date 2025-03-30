import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { demoDossierFondsVert } from "@/utils/demo";

import {
  getDemarcheDossiersData,
  getDossierData,
  resumeProjet,
} from "./fixtures/ds";
import { fondsVertDossierData, fondsVertLoginData } from "./fixtures/fondsvert";
import { CHORUS_NUMBER, CONTACT_EMAIL, DEPARTMENT, DOSSIER_NUMBER, LEGAL_REPRESENTATIVE_EMAIL } from "./fixtures/constants";
import { gristChampsDS } from "./fixtures/grist";
import { authenticatePage } from "./setup/auth";

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

test("dossier page displays project information correctly", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  const breadcrumb = page.getByTestId("breadcrumb-current");
  await expect(breadcrumb).toBeVisible();

  const homeLink = breadcrumb
    .locator("ol.fr-breadcrumb__list > li")
    .first()
    .locator("a");
  await expect(homeLink).toBeVisible();
  await expect(homeLink).toHaveAttribute("href", "/");

  const backLink = breadcrumb
    .locator("ol.fr-breadcrumb__list > li")
    .nth(1)
    .locator("a");
  await expect(backLink).toBeVisible();
  await expect(backLink).toHaveAttribute(
    "href",
    "/espace-laureat?siret=12345678910111",
  );

  await expect(breadcrumb).toContainText("Dossier n°123456789");
  await expect(page.getByTestId("project-title")).toHaveText(
    "Rénovation de la piscine Jaques Demy",
  );
  await expect(page.getByTestId("program-title")).toHaveText(
    "Rénovation énergétique des bâtiments publics locaux",
  );

  await expect(page.getByTestId("project-summary")).toContainText(resumeProjet);

  await expect(page.getByTestId("legal-rep-email")).toContainText(
    LEGAL_REPRESENTATIVE_EMAIL,
  );

  await expect(page.getByTestId("contact-email")).toContainText(
    CONTACT_EMAIL,
  );

  await expect(page.getByTestId("department")).toContainText(DEPARTMENT);
});

test("dossier page displays subvention financial details correctly", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  await expect(page.getByTestId("subvention-amount")).toContainText(
    "8 073 564,00 € attribué",
  );

  await expect(page.getByTestId("chorus-number")).toContainText(
    CHORUS_NUMBER,
  );

  const paymentLink = page.getByTestId("payment-request-link");
  await expect(paymentLink).toHaveAttribute(
    "href",
    "https://www.demarches-simplifiees.fr/commencer/813814e9-84dd-43ce-9e38-f64b561abf5f",
  );
  await expect(paymentLink).toHaveAttribute("target", "_blank");
  await expect(paymentLink).toHaveText("Demander un versement");

  await expect(page.getByTestId("financial-timeline-container")).toBeVisible();
});

test("dossier page displays impact metrics correctly", async ({ page }) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  for (const [key, metric] of Object.entries(
    demoDossierFondsVert.metrique_specifique || {},
  )) {
    if (metric.valeur_estimee === null) continue;

    const metricElement = page.getByTestId(`metric-${key}`);
    await expect(metricElement).toBeVisible();
    await expect(metricElement).toContainText(metric.label);

    const formattedValue = String(metric.valeur_estimee).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      " ",
    );
    const expectedText = metric.unite
      ? `${formattedValue} ${metric.unite}`
      : formattedValue;
    await expect(page.getByTestId(`metric-${key}-value-display`)).toContainText(
      expectedText,
    );
  }

  const impactLink = page.getByTestId("impact-evaluation-link");
  await expect(impactLink).toBeVisible();
  await expect(impactLink).toHaveAttribute("target", "_blank");
  await expect(impactLink).toContainText("Compléter l'évaluation");
});

test("navigation links work correctly", async ({ page }) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  // Access breadcrumb by data-testid and its child elements by structure
  const breadcrumb = page.getByTestId("breadcrumb-current");

  // Check home link (first li > a)
  const homeLink = breadcrumb
    .locator("ol.fr-breadcrumb__list > li")
    .first()
    .locator("a");
  await expect(homeLink).toHaveAttribute("href", "/");

  // Check back link (second li > a)
  const backLink = breadcrumb
    .locator("ol.fr-breadcrumb__list > li")
    .nth(1)
    .locator("a");
  await expect(backLink).toHaveAttribute(
    "href",
    "/espace-laureat?siret=12345678910111",
  );

  const footerBack = page.getByTestId("footer-back");
  await expect(footerBack).toBeVisible();
  await expect(footerBack).toHaveAttribute(
    "href",
    "/espace-laureat?siret=12345678910111",
  );
  await expect(footerBack).toHaveText("Retour");
});
