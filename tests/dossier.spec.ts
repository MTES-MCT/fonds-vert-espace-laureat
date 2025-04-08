import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  CHORUS_NUMBER,
  CONTACT_EMAIL,
  DEPARTMENT,
  DOSSIER_NUMBER,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
} from "./fixtures/constants";
import { getDemarcheDossiersData, getDossierData } from "./fixtures/ds";
import { fondsVertDossierData, fondsVertLoginData } from "./fixtures/fondsvert";
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

  await expect(page.getByTestId("breadcrumb-current")).toContainText(
    "Dossier n°123456789",
  );

  await expect(page.getByTestId("project-title")).toHaveText(PROJECT_TITLE);
  await expect(page.getByTestId("program-title")).toHaveText(PROGRAM_TITLE);

  await expect(page.getByTestId("project-summary")).toContainText(
    PROJECT_SUMMARY,
  );

  await expect(page.getByTestId("legal-rep-email")).toContainText(
    LEGAL_REPRESENTATIVE_EMAIL,
  );

  await expect(page.getByTestId("contact-email")).toContainText(CONTACT_EMAIL);

  await expect(page.getByTestId("department")).toContainText(DEPARTMENT);
});

test("dossier page displays subvention financial details correctly", async ({
  page,
}) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

  await expect(page.getByTestId("subvention-amount")).toContainText(
    "10 073 564,00 € attribué",
  );

  await expect(page.getByTestId("chorus-number")).toContainText(CHORUS_NUMBER);

  await expect(page.getByTestId("payment-request-link")).toBeVisible();
  await expect(page.getByTestId("financial-timeline-container")).toBeVisible();
});

test("dossier page displays impact metrics correctly", async ({ page }) => {
  await page.goto(`/espace-laureat/${DOSSIER_NUMBER}`);

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

  const emissionsGES = page.getByTestId("metric-emissions-de-ges");
  await expect(emissionsGES).toContainText("Émissions de GES");

  const gainEnergetique = page.getByTestId("metric-gain-energetique-estime");
  await expect(gainEnergetique).toContainText("Gain énergétique estimé");
  await expect(gainEnergetique.getByTestId("valeur-estimee")).toContainText(
    "39%",
  );
  await expect(gainEnergetique.getByTestId("valeur-reelle")).toContainText(
    "32%",
  );

  await expect(page.getByTestId("impact-evaluation-link")).toBeVisible();
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
