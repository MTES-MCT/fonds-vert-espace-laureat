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

import { makeDossierDataWithNumber } from "./fixtures/ds";
import { fondsVertDossierData } from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import {
  createTestDatabaseClient,
  deleteStoredDossierMetrics,
  getStoredDossierMetrics,
  importStoredDossierMetricsIfMissing,
} from "./setup/db";
import { configureAdministratorDossierFixtures } from "./setup/dossier";

async function waitForDsfrModal(page: Page) {
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });
}
const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const DOSSIER_NUMBER = 89334002;
configureAdministratorDossierFixtures(DOSSIER_NUMBER);

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
    await card.getByRole("button", { name: /^Modifier la valeur «/ }).click();
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
    await card.getByRole("button", { name: /^Modifier la valeur «/ }).click();
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

    const beforeRow = page.getByRole("region", {
      name: "Énergie test avant travaux",
    });
    const afterRow = page.getByRole("region", {
      name: "Énergie test après travaux",
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
