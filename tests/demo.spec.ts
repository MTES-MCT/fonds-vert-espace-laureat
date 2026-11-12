import {
  expect,
  type Page,
  test,
} from "next/experimental/testmode/playwright/msw";

import {
  appendDossierMetricRevision,
  getDossierMetricRevisionTargets,
} from "@/db/dossierMetrics";
import { resetDemoCatalogue } from "@/db/publicDemoWrites";
import { DEMO_POOL_NUMBER } from "@/utils/demo/reservation";

import {
  createTestDatabaseClient,
  deleteStoredDossierProgress,
  getStoredDossierProgressRevisions,
} from "./setup/db";

test.describe.configure({ mode: "default" });

const PENDING_ANALYSIS = "En attente d’analyse";
const poolPath = `/projets/demo/${DEMO_POOL_NUMBER}`;

test.beforeEach(resetDemoCatalogue);
test.afterEach(resetDemoCatalogue);

function demoTools(page: Page) {
  return page.getByRole("complementary", { name: "Outils de démonstration" });
}

async function openDemoTools(page: Page) {
  await demoTools(page).locator("summary").click();
}

async function waitForDemoWrite() {
  const sql = createTestDatabaseClient();
  try {
    await expect
      .poll(async () => {
        const [row] = await sql`select not exists (
        select from fonds_vert_export_admission
        where id = 3 and next_allowed_at > clock_timestamp()
      ) as ready`;
        return row.ready;
      })
      .toBe(true);
  } finally {
    await sql.end();
  }
}

function impactTab(page: Page) {
  return page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true });
}

test("demo page loads, corrects and persists its database-backed metrics", async ({
  page,
}) => {
  await page.goto(poolPath);
  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });

  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    page.getByRole("region", { name: "Signalements Fonds vert" }),
  ).toHaveCount(0);

  const impactSection = page.getByTestId("impact-section");
  const energyBeforeAnomaly = impactSection
    .getByRole("region", {
      name: "Consommation énergétique avant travaux",
      exact: true,
    })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(energyBeforeAnomaly).toHaveCount(1);
  await expect(energyBeforeAnomaly).toHaveText("Anomalie");

  const energyGainAnomaly = impactSection
    .getByRole("region", {
      name: "Gain énergétique estimé",
      exact: true,
    })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(energyGainAnomaly).toHaveText("Anomalie");
  await expect(
    impactSection
      .getByRole("region", {
        name: "Gain énergétique estimé",
        exact: true,
      })
      .getByRole("button", { name: /^Modifier la valeur «/ }),
  ).toBeVisible();

  const gesBeforeAnomaly = impactSection
    .getByRole("region", {
      name: "Émissions de GES avant travaux",
      exact: true,
    })
    .getByRole("note", { name: "Anomalie détectée" });
  await expect(gesBeforeAnomaly).toHaveText("Erreur");

  let anomaly = impactSection.getByRole("region", {
    name: "Consommation énergétique avant travaux",
    exact: true,
  });

  await anomaly.getByRole("button", { name: "Modifier" }).click();
  let dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Consommation énergétique avant travaux"),
  ).toBeVisible();
  await expect(dialog.getByLabel("Valeur source")).toHaveCount(0);
  await expect(
    dialog.getByLabel("Consommation énergétique avant travaux"),
  ).toBeFocused();
  await expect(dialog.getByText("Unité : kWh", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toBeHidden();
  await expect(anomaly.getByRole("button", { name: "Modifier" })).toBeFocused();

  await anomaly.getByRole("button", { name: "Modifier" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog
    .getByLabel("Consommation énergétique avant travaux")
    .fill("1 900 000,5");
  await waitForDemoWrite();
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("status").filter({
      hasText: "Correction enregistrée",
    }),
  ).toBeVisible();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    impactSection.getByRole("region", {
      name: "Consommation énergétique avant travaux",
    }),
  ).toContainText(/1\s*900\s*000,5/);
  await expect(energyBeforeAnomaly).toHaveCount(1);
  await expect(
    impactSection
      .getByRole("region", {
        name: "Consommation énergétique avant travaux",
        exact: true,
      })
      .getByText(PENDING_ANALYSIS, { exact: true }),
  ).toBeVisible();

  const sql = createTestDatabaseClient();
  try {
    const revisions =
      await sql`select revision, author_email from dossier_metric_revisions
      where dossier_number = ${DEMO_POOL_NUMBER}
        and metric_code = 'conso_energetique_avant_travaux' order by revision`;
    expect(revisions).toEqual([
      { revision: 1, author_email: null },
      { revision: 2, author_email: null },
    ]);
  } finally {
    await sql.end();
  }

  await page.reload();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    impactSection.getByRole("region", {
      name: "Consommation énergétique avant travaux",
    }),
  ).toContainText(/1\s*900\s*000,5/);

  anomaly = impactSection.getByRole("region", {
    name: "Émissions de GES avant travaux",
    exact: true,
  });
  await anomaly.getByRole("button", { name: "Modifier" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog.getByLabel("Émissions de GES avant travaux").fill("420");
  await waitForDemoWrite();
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();

  await expect(dialog).toBeHidden();
  await expect(anomaly.getByText("420kgCO₂e")).toBeVisible();
  await expect(gesBeforeAnomaly).toHaveText(PENDING_ANALYSIS);
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );

  const initialViewport = page.viewportSize()!;
  const pendingBadge = gesBeforeAnomaly.getByText(PENDING_ANALYSIS, {
    exact: true,
  });
  for (const width of [320, 1024, 1152, 1280]) {
    await page.setViewportSize({ ...initialViewport, width });
    await expect(pendingBadge).toBeVisible();
    const fitsOnOneLine = await pendingBadge.evaluate((badge) => {
      const badgeBounds = badge.getBoundingClientRect();
      const rowBounds = badge.closest("dl")!.getBoundingClientRect();
      const text = document.createRange();
      text.selectNodeContents(badge);
      return (
        badgeBounds.height <= parseFloat(getComputedStyle(badge).lineHeight) &&
        text.getBoundingClientRect().right <= badgeBounds.right &&
        badgeBounds.right <= rowBounds.right + 1
      );
    });
    expect(fitsOnOneLine, `Le badge tient dans sa cellule à ${width} px`).toBe(
      true,
    );
  }
  await page.setViewportSize(initialViewport);

  await anomaly.getByRole("button", { name: "Modifier" }).click();
  dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await expect(dialog.getByLabel("Valeur source")).toHaveCount(0);
  await expect(dialog.getByLabel("Émissions de GES avant travaux")).toHaveValue(
    "420",
  );
  await dialog.getByRole("button", { name: "Annuler" }).click();

  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Synthèse du projet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  const progressDialog = page.getByRole("dialog", {
    name: "Modifier l’avancement",
    exact: true,
  });
  await progressDialog
    .getByRole("combobox", { name: "Avancement du projet" })
    .selectOption("En cours de réalisation");
  await waitForDemoWrite();
  await progressDialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(progressDialog).toBeHidden();
  await page.reload();
  await expect(
    page
      .getByTestId("project-progress-row")
      .locator(".fr-badge")
      .filter({ hasText: /^En cours de réalisation$/ }),
  ).toBeVisible();
  const progressRevisions =
    await getStoredDossierProgressRevisions(DEMO_POOL_NUMBER);
  expect(
    progressRevisions.map(({ status, author_email }) => ({
      status,
      author_email,
    })),
  ).toEqual([{ status: "En cours de réalisation", author_email: null }]);

  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  await progressDialog.getByRole("combobox").selectOption("Bloqué");
  const resetPage = await page.context().newPage();
  await resetPage.goto("/projets/demo");
  await openDemoTools(resetPage);
  await waitForDemoWrite();
  await Promise.all([
    resetPage.waitForEvent("load"),
    resetPage.getByRole("button", { name: "Réinitialiser la démo" }).click(),
  ]);
  await resetPage.close();

  await waitForDemoWrite();
  await progressDialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(progressDialog.getByRole("alert")).toContainText(
    "L’avancement actuel a été chargé",
  );
  await expect(progressDialog.getByRole("combobox")).toHaveValue("");
  await progressDialog.getByRole("button", { name: "Annuler" }).click();
  const progressSection = page.getByTestId("project-progress-row");
  await expect(
    progressSection.locator(".fr-badge").filter({ hasText: /^Non renseigné$/ }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Modifier l’avancement", exact: true })
    .click();
  await progressDialog.getByRole("combobox").selectOption("Non-commencé");
  await waitForDemoWrite();
  await progressDialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(progressDialog).toBeHidden();
  await expect(progressSection.locator(".fr-badge")).toHaveText("Non-commencé");
  const resetProgressRevisions =
    await getStoredDossierProgressRevisions(DEMO_POOL_NUMBER);
  expect(
    resetProgressRevisions.map(({ revision, status, author_email }) => ({
      revision,
      status,
      author_email,
    })),
  ).toEqual([{ revision: 1, status: "Non-commencé", author_email: null }]);

  await openDemoTools(page);
  await waitForDemoWrite();
  await Promise.all([
    page.waitForEvent("load"),
    demoTools(page)
      .getByRole("button", {
        name: "Réinitialiser la démo",
      })
      .click(),
  ]);

  await expect(
    page
      .getByTestId("project-progress-row")
      .getByText("Non renseigné", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    impactSection.getByText(/2\s*055\s*650\s*kWh/).first(),
  ).toBeVisible();
  await expect(impactSection.getByText("448kgCO₂e")).toBeVisible();
  await expect(energyBeforeAnomaly).toHaveCount(1);

  await page.reload();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(impactSection.getByText("448kgCO₂e")).toBeVisible();
});

test("la démo refuse une nouvelle révision d’avancement au plafond", async ({
  request,
}) => {
  const sql = createTestDatabaseClient();
  const progressUrl = `/api/projets/demo/${DEMO_POOL_NUMBER}/progress`;
  const changeProgress = async (status: string, expectedRevision: number) => {
    await waitForDemoWrite();
    return request.post(progressUrl, { data: { status, expectedRevision } });
  };

  try {
    await deleteStoredDossierProgress(DEMO_POOL_NUMBER);
    await sql`insert into dossier_progress_revisions (dossier_number, revision, status)
      select ${DEMO_POOL_NUMBER}, revision, 'Non-commencé'::dossier_progress_status
      from generate_series(1, 99) as revision`;

    await test.step("Le visiteur enregistre la centième révision", async () => {
      const saved = await changeProgress("En cours de réalisation", 99);
      expect(saved.status()).toBe(200);
      expect(await saved.json()).toMatchObject({
        target: { revision: 100, status: "En cours de réalisation" },
      });
    });

    await test.step("Au plafond, un changement est refusé et le même statut reste sans effet", async () => {
      const refused = await changeProgress("Bloqué", 100);
      expect(refused.status()).toBe(409);
      expect(await refused.json()).toEqual({
        error:
          "La limite de révisions est atteinte. Réinitialisez la démonstration pour continuer.",
      });

      const unchanged = await changeProgress("En cours de réalisation", 100);
      expect(unchanged.status()).toBe(200);
      expect(await unchanged.json()).toMatchObject({
        target: { revision: 100, status: "En cours de réalisation" },
      });
      const revisions =
        await getStoredDossierProgressRevisions(DEMO_POOL_NUMBER);
      expect(revisions).toHaveLength(100);
      expect(revisions.at(-1)).toMatchObject({
        revision: 100,
        status: "En cours de réalisation",
      });
    });

    await test.step("Au plafond, un onglet périmé reçoit encore l’état courant", async () => {
      const stale = await changeProgress("Bloqué", 99);
      expect(stale.status()).toBe(409);
      expect(await stale.json()).toMatchObject({
        target: { revision: 100, status: "En cours de réalisation" },
      });
    });
  } finally {
    await sql.end();
    await deleteStoredDossierProgress(DEMO_POOL_NUMBER);
  }
});

for (const width of [1440, 390]) {
  test(`les outils de démonstration flottent en bas à droite à ${width} px sans élargir la page`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${poolPath}/impact`);

    await openDemoTools(page);
    const tools = demoTools(page);
    await expect(
      tools.getByRole("combobox", { name: "Réponse Fonds vert simulée" }),
    ).toBeVisible();
    await expect(
      tools.getByRole("button", { name: "Réinitialiser la démo" }),
    ).toBeVisible();
    await expect(page.getByTestId("project-frame")).not.toContainText(
      "Réponse Fonds vert simulée",
    );

    await expect(tools).toHaveCSS("position", "fixed");
    const bounds = await tools.boundingBox();
    if (!bounds) throw new Error("Les outils doivent être affichés.");
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    expect(width - (bounds.x + bounds.width)).toBeLessThan(bounds.x);
    expect(900 - (bounds.y + bounds.height)).toBeLessThan(bounds.y);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        tools.evaluate((element) => element.scrollWidth <= element.clientWidth),
      )
      .toBe(true);
  });
}

for (const width of [1440, 390]) {
  test(`le lecteur trouve avant et après travaux et les données liées sur des lignes consécutives à ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${poolPath}/impact`);
    const values = page.getByTestId("impact-section");

    await expect(values.getByRole("region").first()).toBeVisible();
    const metricLabels = await values
      .getByRole("region")
      .evaluateAll((regions) =>
        regions.map((region) => region.getAttribute("aria-label")),
      );
    for (const [firstLabel, secondLabel] of [
      [
        "Consommation énergétique avant travaux",
        "Consommation énergétique après travaux",
      ],
      ["Surface du bâtiment avant projet", "Type de surface"],
      ["Nature des opérations", "Types des bâtiments"],
    ]) {
      const first = values.getByRole("region", {
        name: firstLabel,
        exact: true,
      });
      const second = values.getByRole("region", {
        name: secondLabel,
        exact: true,
      });
      const firstBounds = await first.boundingBox();
      const secondBounds = await second.boundingBox();
      if (!firstBounds || !secondBounds) {
        throw new Error("Les deux données liées doivent être affichées.");
      }

      expect(metricLabels[metricLabels.indexOf(firstLabel) + 1]).toBe(
        secondLabel,
      );
      expect(secondBounds.y).toBeGreaterThanOrEqual(
        firstBounds.y + firstBounds.height,
      );
    }
  });
}

for (const [situation, width, besideValue] of [
  ["dans une colonne à part sur grand écran", 1440, true],
  ["sous la valeur sur mobile", 390, false],
] as const) {
  test(`le lecteur voit les signalements d’une valeur ${situation}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${poolPath}/impact`);
    const before = page.getByTestId("impact-section").getByRole("region", {
      name: "Consommation énergétique avant travaux",
      exact: true,
    });

    const value = await before.getByTestId("valeur-estimee").boundingBox();
    const note = await before
      .getByRole("note", { name: "Anomalie détectée" })
      .first()
      .boundingBox();
    if (!value || !note) {
      throw new Error("La valeur et son signalement doivent être affichés.");
    }

    if (besideValue) {
      expect(note.x).toBeGreaterThan(value.x + value.width);
      expect(note.y).toBeLessThan(value.y + value.height);
      expect(note.y + note.height).toBeGreaterThan(value.y);
    } else {
      expect(note.y).toBeGreaterThanOrEqual(value.y + value.height);
    }
  });
}

test("fits related energy metric values and actions on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(poolPath);
  await page
    .getByRole("navigation", { name: "Pages du projet" })
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();

  const card = page.getByTestId("metric-group-energy");

  for (const label of [
    "Consommation énergétique avant travaux",
    "Consommation énergétique après travaux",
    "Gain énergétique estimé",
  ]) {
    await expect(
      card
        .getByRole("region", { name: label, exact: true })
        .getByRole("button", { name: "Modifier" }),
    ).toBeVisible();
  }
  await expect
    .poll(() =>
      card.evaluate((element) => element.scrollWidth <= element.clientWidth),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      card.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= window.innerWidth;
      }),
    )
    .toBe(true);
});

test("keeps demo corrections until a distinct simulated Fonds vert response is selected", async ({
  page,
}) => {
  await page.goto(poolPath);
  const navigation = page.getByRole("navigation", { name: "Pages du projet" });
  await navigation
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();

  const before = page.getByTestId("impact-section").getByRole("region", {
    name: "Consommation énergétique avant travaux",
    exact: true,
  });
  const modifier = before.getByRole("button", {
    name: /^Modifier la valeur «/,
  });
  await page.waitForSelector('[data-fr-js-modal-button="true"]', {
    state: "attached",
  });
  await modifier.click();
  const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  await dialog
    .getByLabel("Consommation énergétique avant travaux")
    .fill("2000000");
  await waitForDemoWrite();
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(modifier).toBeFocused();
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(
    before.getByRole("note", { name: "Anomalie détectée" }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    before.getByText(PENDING_ANALYSIS, { exact: true }),
  ).toBeVisible();
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /2\s*000\s*000\s*kWh/,
  );

  await openDemoTools(page);
  const source = demoTools(page).getByRole("combobox", {
    name: "Réponse Fonds vert simulée",
  });
  await source.selectOption("recalculated");
  await expect(page).toHaveURL(
    /\/projets\/demo\/102\/impact\?fondsVert=recalculated$/,
  );
  await expect(impactTab(page)).not.toHaveAttribute("aria-describedby");
  await expect(
    before.getByRole("note", { name: "Anomalie détectée" }),
  ).toHaveCount(0);
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /2\s*000\s*000\s*kWh/,
  );
  await navigation
    .getByRole("link", { name: "Synthèse du projet", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projets\/demo\/102\?fondsVert=recalculated$/);
  await navigation
    .getByRole("link", { name: "Données d’impact", exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/projets\/demo\/102\/impact\?fondsVert=recalculated$/,
  );
  await expect(
    page.getByRole("heading", { name: "Données d’impact", exact: true }),
  ).toBeVisible();
  await openDemoTools(page);
  await expect(source).toHaveValue("recalculated");

  await source.selectOption("unavailable");
  await expect(page.locator(".fr-alert")).toContainText(
    "Les valeurs déjà enregistrées restent consultables",
  );
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /2\s*000\s*000\s*kWh/,
  );

  await waitForDemoWrite();
  await Promise.all([
    page.waitForEvent("load"),
    demoTools(page)
      .getByRole("button", { name: "Réinitialiser la démo" })
      .click(),
  ]);
  await expect(page).toHaveURL(/\/projets\/demo\/102\/impact$/);
  await openDemoTools(page);
  await expect(source).toHaveValue("initial");
  await expect(impactTab(page)).toHaveAccessibleDescription(
    "3 données à vérifier",
  );
  await expect(before.getByText(PENDING_ANALYSIS, { exact: true })).toHaveCount(
    0,
  );
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /2\s*055\s*650\s*kWh/,
  );
  await expect(
    getDossierMetricRevisionTargets({ numeroDossier: DEMO_POOL_NUMBER }),
  ).resolves.toMatchObject({
    conso_energetique_avant_travaux: { revision: 1, effectiveValue: 2055650 },
  });
});

test("replaces a demo metric after another tab resets its revisions and permits a fresh correction", async ({
  page,
}) => {
  await page.goto(`${poolPath}/impact`);
  const before = page.getByTestId("impact-section").getByRole("region", {
    name: "Consommation énergétique avant travaux",
    exact: true,
  });
  const modifier = before.getByRole("button", {
    name: /^Modifier la valeur «/,
  });
  const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
  const input = dialog.getByLabel("Consommation énergétique avant travaux");
  for (const value of ["2000000", "1900000"]) {
    await modifier.click();
    await input.fill(value);
    await waitForDemoWrite();
    await dialog
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }
  await page.reload();
  await modifier.click();
  await input.fill("1800000");

  const resetPage = await page.context().newPage();
  await resetPage.goto("/projets/demo");
  await openDemoTools(resetPage);
  await waitForDemoWrite();
  await Promise.all([
    resetPage.waitForEvent("load"),
    resetPage.getByRole("button", { name: "Réinitialiser la démo" }).click(),
  ]);
  await resetPage.close();

  const submittedRevisions: number[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/metrics/conso_energetique_avant_travaux")
    ) {
      submittedRevisions.push(request.postDataJSON().expectedRevision);
    }
  });
  await waitForDemoWrite();
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "La valeur actuelle a été chargée",
  );
  await expect(input).toHaveValue("2055650");
  await expect(input).toBeFocused();
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /2\s*055\s*650\s*kWh/,
  );
  expect(submittedRevisions).toEqual([3]);
  await expect(
    getDossierMetricRevisionTargets({ numeroDossier: DEMO_POOL_NUMBER }),
  ).resolves.toMatchObject({
    conso_energetique_avant_travaux: { revision: 1, effectiveValue: 2055650 },
  });

  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(modifier).toBeFocused();
  await modifier.press("Enter");
  await expect(input).toHaveValue("2055650");
  await input.fill("1800000");
  await waitForDemoWrite();
  await dialog
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(modifier).toBeFocused();
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /1\s*800\s*000\s*kWh/,
  );
  expect(submittedRevisions).toEqual([3, 1]);
  await expect(
    getDossierMetricRevisionTargets({ numeroDossier: DEMO_POOL_NUMBER }),
  ).resolves.toMatchObject({
    conso_energetique_avant_travaux: { revision: 2, effectiveValue: 1800000 },
  });
  const sql = createTestDatabaseClient();
  try {
    expect(
      await sql`select revision,author_email from dossier_metric_revisions
      where dossier_number=${DEMO_POOL_NUMBER} and metric_code='conso_energetique_avant_travaux' order by revision`,
    ).toEqual([
      { revision: 1, author_email: null },
      { revision: 2, author_email: null },
    ]);
  } finally {
    await sql.end();
  }
  await openDemoTools(page);
  const source = demoTools(page).getByRole("combobox", {
    name: "Réponse Fonds vert simulée",
  });
  await appendDossierMetricRevision({
    numeroDossier: DEMO_POOL_NUMBER,
    metricCode: "conso_energetique_avant_travaux",
    value: 1700000,
    expectedRevision: 2,
    authorEmail: null,
  });
  await source.selectOption("recalculated");
  await expect(impactTab(page)).not.toHaveAttribute("aria-describedby");
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /1\s*700\s*000\s*kWh/,
  );
  await modifier.click();
  await expect(input).toHaveValue("1700000");
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await page.reload();
  await expect(before.getByTestId("valeur-estimee")).toHaveText(
    /1\s*700\s*000\s*kWh/,
  );
});
