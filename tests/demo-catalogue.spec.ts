import { expect, test } from "@playwright/test";

import { LEGACY_DEMO_NUMBER } from "@/utils/demo/reservation";

import { createTestDatabaseClient } from "./setup/db";

const realDossier = 89996100;
const demoApi = "/api/v1/demo/corrections";
const realApi = "/api/v1/corrections";
const demoHeaders = {
  authorization: "Bearer synthetic_demo_key_000000000000000000000000000",
};
const realHeaders = {
  authorization: "Bearer synthetic_current_key_000000000000000000000000",
  "x-corrections-ingress": "synthetic_ingress_key_000000000000000000000000",
  "x-corrections-client-ip": "192.0.2.10",
  "x-corrections-proto": "https",
};
const before = "conso_energetique_avant_travaux";
const after = "conso_energetique_apres_travaux";

test.skip(
  process.env.CORRECTIONS_TEST_PROFILE !== "enabled",
  "Utiliser le profil isolé de l’API des corrections.",
);

test("un visiteur parcourt les deux vues et retrouve ses modifications dans l’export fictif", async ({
  page,
  request,
}, testInfo) => {
  const tools = page.getByRole("complementary", {
    name: "Outils de démonstration",
  });
  const openTools = () => tools.locator("summary").click();
  const sql = createTestDatabaseClient();
  const clean = async () => {
    await sql`delete from dossier_metric_revisions where dossier_number in (101, 102, 103, 104, ${realDossier}, ${LEGACY_DEMO_NUMBER})`;
    await sql`delete from dossier_progress_revisions where dossier_number in (101, 102, 103, 104, ${realDossier}, ${LEGACY_DEMO_NUMBER})`;
    await sql`delete from fonds_vert_export_pages`;
    await sql`delete from fonds_vert_export_admission`;
  };
  const waitForWrite = () =>
    expect
      .poll(async () => {
        const [row] =
          await sql`select not exists (select from fonds_vert_export_admission where id = 3 and next_allowed_at > clock_timestamp()) as ready`;
        return row.ready;
      })
      .toBe(true);
  const writeMetric = (
    dossier: number,
    field: string,
    value: number,
    expectedRevision = 1,
  ) =>
    request.post(`/api/projets/demo/${dossier}/metrics/${field}`, {
      data: { value, expectedRevision },
    });

  try {
    await clean();
    await sql`insert into dossier_metric_revisions
      (dossier_number, metric_code, revision, label, value_type, number_value)
      values (${realDossier}, ${before}, 1, 'Consommation', 'number', 25),
             (${realDossier}, ${before}, 2, 'Consommation', 'number', 35),
             (${realDossier}, ${after}, 1, 'Consommation', 'number', 10),
             (${realDossier}, ${after}, 2, 'Consommation', 'number', 20),
             (${LEGACY_DEMO_NUMBER}, ${before}, 1, 'Consommation historique', 'number', 180000),
             (${LEGACY_DEMO_NUMBER}, ${before}, 2, 'Consommation historique', 'number', 191000)`;
    await sql`insert into dossier_progress_revisions (dossier_number, revision, status)
      values (${LEGACY_DEMO_NUMBER}, 1, 'En cours de réalisation')`;

    await test.step("Le porteur retrouve ses deux dossiers et l’instructeur voit les quatre", async () => {
      await page.goto("/projets/demo");
      await expect(
        page.getByRole("heading", { name: "Mes projets" }),
      ).toBeVisible();
      await expect(page.getByRole("row")).toHaveCount(3);
      await page.goto("/projets/demo/103");
      await expect(
        page.getByRole("heading", {
          name: "Projet de démonstration introuvable",
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Collecte séparée des biodéchets"),
      ).toHaveCount(0);
      await page
        .getByRole("link", { name: "Revenir aux projets de démonstration" })
        .click();
      const disclosure = tools.locator("summary");
      await expect(disclosure).toHaveText("Démonstration · Porteur");
      await disclosure.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Tab");
      await expect(
        tools.getByRole("link", { name: "Passer en vue instructeur" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(disclosure).toHaveText("Démonstration · Instructeur");
      await expect(page.getByRole("row")).toHaveCount(5);
      await expect(
        page.getByRole("row").filter({ hasText: "l’école des Tilleuls" }),
      ).toContainText(/en cours de réalisation/i);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("catalogue-bureau.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 375, height: 850 });
      const table = page.getByRole("region", { name: "Tableau des projets" });
      await table.focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => table.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
      await table.evaluate((element) => {
        element.scrollLeft = 0;
      });
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("catalogue-mobile.png"),
      });
      await page.setViewportSize({ width: 1280, height: 900 });
    });

    const metricLabel = "Consommation énergétique avant travaux";
    const metric = page.getByRole("region", { name: metricLabel, exact: true });

    await test.step("L’instructeur ouvre la synthèse puis corrige la consommation signalée dans l’onglet Impact", async () => {
      await expect(
        page.getByRole("link", { name: /pour le projet n°101/ }),
      ).toHaveAttribute(
        "href",
        "/projets/demo/101/impact?vue=instructeur#signalements",
      );
      const projectTitle = "Rénovation de l’école des Tilleuls";
      await page.getByRole("link", { name: projectTitle }).click();
      await expect(
        page.getByRole("heading", { name: projectTitle }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Données d’impact", exact: true })
        .click();
      await expect(
        metric.getByRole("note", { name: "Anomalie détectée" }),
      ).toBeVisible();
      await metric.getByRole("button", { name: "Modifier" }).click();
      const dialog = page.getByRole("dialog", { name: "Modifier la valeur" });
      await dialog.getByLabel(metricLabel).fill("192000");
      await dialog
        .getByRole("button", { name: "Enregistrer", exact: true })
        .click();
      await expect(metric).toContainText(/192\s*000/);
      await page.reload();
      await expect(metric).toContainText(/192\s*000/);

      await openTools();
      await page.getByRole("link", { name: "Passer en vue porteur" }).click();
      await expect(page).toHaveURL(/\/projets\/demo\/101\/impact$/);
      await expect(metric).toContainText(/192\s*000/);
      await page.setViewportSize({ width: 375, height: 850 });
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("impact-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1280, height: 900 });
    });

    await test.step("Le porteur modifie l’avancement et le retrouve dans les deux vues", async () => {
      await page
        .getByRole("link", { name: "Synthèse du projet", exact: true })
        .click();
      await page.getByRole("button", { name: "Modifier l’avancement" }).click();
      const dialog = page.getByRole("dialog", {
        name: "Modifier l’avancement",
      });
      await dialog.getByLabel("Avancement du projet").selectOption("Bloqué");
      await waitForWrite();
      await dialog
        .getByRole("button", { name: "Enregistrer", exact: true })
        .click();
      await expect(page.getByTestId("project-progress-row")).toContainText(
        "Bloqué",
      );
      await openTools();
      await page
        .getByRole("link", { name: "Passer en vue instructeur" })
        .click();
      await page.reload();
      await expect(page.getByTestId("project-progress-row")).toContainText(
        "Bloqué",
      );
    });

    await test.step("Le gymnase conserve sa synthèse et son financement quand l’impact est indisponible", async () => {
      await page.goto("/projets/demo?vue=instructeur");
      await page
        .getByRole("link", { name: "Rénovation du gymnase des Rives" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Rénovation du gymnase des Rives" }),
      ).toBeVisible();
      await page
        .getByRole("link", { name: "Financement", exact: true })
        .click();
      await expect(page.getByText(/130\s*000,00\s*€/)).toBeVisible();
      await page
        .getByRole("link", { name: "Données d’impact", exact: true })
        .click();
      await expect(
        page.getByText(/temporairement indisponibles/),
      ).toBeVisible();
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("impact-indisponible-bureau.png"),
        fullPage: true,
      });
      await openTools();
      await page.getByRole("link", { name: "Passer en vue porteur" }).click();
      await expect(page).toHaveURL(/\/projets\/demo$/);
      await page.goto("/projets/demo/impact");
      await expect(page).toHaveURL(/\/projets\/demo\/102\/impact$/);
      await page.goto("/projets/demo/financement?vue=instructeur");
      await expect(page).toHaveURL(
        /\/projets\/demo\/102\/financement\?vue=instructeur$/,
      );
    });

    await test.step("La démo publique refuse le dossier réel existant et accepte le dossier fictif", async () => {
      await page.goto(`/projets/demo/${realDossier}/impact?vue=instructeur`);
      await expect(
        page.getByRole("heading", {
          name: "Projet de démonstration introuvable",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: metricLabel, exact: true }),
      ).toHaveCount(0);

      const progress = await request.post(
        `/api/projets/demo/${realDossier}/progress`,
        {
          data: { status: "Bloqué", expectedRevision: 0 },
        },
      );
      expect(progress.status()).toBe(404);
      expect(await progress.json()).toEqual({
        error: "Cible de démonstration introuvable",
      });
      expect(
        await sql`select revision from dossier_progress_revisions where dossier_number = ${realDossier}`,
      ).toEqual([]);

      for (const number of [realDossier, LEGACY_DEMO_NUMBER]) {
        const route = `/api/projets/demo/${number}/metrics/${before}`;
        const response = await request.post(route, {
          data: { value: 193_000, expectedRevision: 2 },
        });
        expect(response.status()).toBe(404);
        expect(await response.json()).toEqual({
          error: "Cible de démonstration introuvable",
        });
      }

      const legacyCorrection = await request.post(
        `/api/projets/demo/metrics/${before}`,
        {
          data: { value: 193_000, expectedRevision: 2 },
        },
      );
      expect(legacyCorrection.status()).toBe(400);
      expect(await legacyCorrection.json()).toEqual({
        error: "Numéro de dossier invalide",
      });
      const legacyProgress = await request.post("/api/projets/demo/progress", {
        data: { status: "Bloqué", expectedRevision: 1 },
      });
      expect(legacyProgress.status()).toBe(400);
      expect(await legacyProgress.json()).toEqual({
        error: "Numéro de dossier invalide",
      });
      await waitForWrite();
      const oversized = await request.post(
        `/api/projets/demo/101/metrics/${after}`,
        {
          data: {
            value: 126_000,
            expectedRevision: 1,
            padding: "x".repeat(1_024),
          },
        },
      );
      expect(oversized.status()).toBe(400);
      expect((await writeMetric(101, after, 126_000, 100)).status()).toBe(409);
      expect((await writeMetric(101, after, 126_000)).status()).toBe(200);
      expect((await writeMetric(101, after, 127_000, 2)).status()).toBe(429);
    });

    await test.step("La correction historique reste hors des exports et chaque API garde ses clés, curseurs et quotas", async () => {
      expect(
        (await request.get(demoApi, { headers: realHeaders })).status(),
      ).toBe(401);
      expect(
        (
          await request.get(realApi, {
            headers: { ...realHeaders, ...demoHeaders },
          })
        ).status(),
      ).toBe(401);
      const demoResponse = await request.get(`${demoApi}?page_size=1`, {
        headers: demoHeaders,
      });
      expect(demoResponse.status()).toBe(200);
      const demo = await demoResponse.json();
      expect(demo.total_count).toBe(2);
      expect(demo.corrections).toEqual([
        expect.objectContaining({
          dossier_number: 101,
          champ: after,
          valeur_corrigee: 126_000,
        }),
      ]);
      expect(
        (await request.get(demoApi, { headers: demoHeaders })).status(),
      ).toBe(429);

      const realResponse = await request.get(`${realApi}?page_size=1`, {
        headers: realHeaders,
      });
      expect(realResponse.status()).toBe(200);
      const real = await realResponse.json();
      expect(real.total_count).toBe(2);
      expect(real.corrections).toEqual([
        expect.objectContaining({
          dossier_number: realDossier,
          champ: after,
          valeur_corrigee: 20,
        }),
      ]);
      expect(
        (
          await request.get(`${realApi}?cursor=${demo.next_cursor}`, {
            headers: realHeaders,
          })
        ).status(),
      ).toBe(404);
      expect(
        (
          await request.get(`${demoApi}?cursor=${real.next_cursor}`, {
            headers: demoHeaders,
          })
        ).status(),
      ).toBe(404);

      await waitForWrite();
      expect((await writeMetric(101, before, 193_000, 2)).status()).toBe(200);
      const continuation = await request.get(
        `${demoApi}?cursor=${demo.next_cursor}`,
        { headers: demoHeaders },
      );
      expect(continuation.status()).toBe(200);
      expect((await continuation.json()).corrections).toEqual([
        expect.objectContaining({
          dossier_number: 101,
          champ: before,
          valeur_corrigee: 192_000,
        }),
      ]);

      await sql`update fonds_vert_export_admission set next_allowed_at = now() where id = 2`;
      const fresh = await request.get(demoApi, { headers: demoHeaders });
      expect(fresh.status()).toBe(200);
      expect((await fresh.json()).corrections).toContainEqual(
        expect.objectContaining({ champ: before, valeur_corrigee: 193_000 }),
      );
      expect(
        (await request.get(realApi, { headers: realHeaders })).status(),
      ).toBe(429);
    });

    await test.step("La réinitialisation publique restaure le catalogue et conserve les révisions réelles et historiques", async () => {
      await page.goto("/projets/demo/101/impact");
      await waitForWrite();
      await openTools();
      await tools
        .getByRole("button", { name: "Réinitialiser la démo" })
        .click();
      await expect(metric).toContainText(/180\s*000/);
      await page
        .getByRole("link", { name: "Synthèse du projet", exact: true })
        .click();
      await expect(page.getByTestId("project-progress-row")).toContainText(
        "En cours",
      );
      await sql`update fonds_vert_export_admission set next_allowed_at = now() where id in (1, 2)`;
      const demo = await request.get(demoApi, { headers: demoHeaders });
      expect(demo.status()).toBe(200);
      expect(await demo.json()).toMatchObject({
        corrections: [],
        total_count: 0,
      });
      expect(
        await sql`select revision, number_value::int as value
          from dossier_metric_revisions
          where dossier_number = ${LEGACY_DEMO_NUMBER} order by revision`,
      ).toEqual([
        { revision: 1, value: 180_000 },
        { revision: 2, value: 191_000 },
      ]);
      expect(
        await sql`select revision, status from dossier_progress_revisions
          where dossier_number = ${LEGACY_DEMO_NUMBER}`,
      ).toEqual([{ revision: 1, status: "En cours de réalisation" }]);

      const real = await request.get(realApi, { headers: realHeaders });
      expect(real.status()).toBe(200);
      expect(await real.json()).toMatchObject({
        total_count: 2,
        corrections: [
          { dossier_number: realDossier, champ: after, valeur_corrigee: 20 },
          { dossier_number: realDossier, champ: before, valeur_corrigee: 35 },
        ],
      });
    });
  } finally {
    await clean();
    await sql.end();
  }
});

test("le porteur et l’instructeur consultent les mesures et les trois exercices de la piscine Jacques Demy", async ({
  page,
}, testInfo) => {
  const title = "Rénovation de la piscine Jacques Demy";
  const tools = page.getByRole("complementary", {
    name: "Outils de démonstration",
  });
  const disclosure = tools.locator("summary");
  const source = tools.getByRole("combobox", {
    name: "Réponse Fonds vert simulée",
  });
  const summary = page.getByRole("link", {
    name: "Synthèse du projet",
    exact: true,
  });
  const impact = page.getByRole("link", {
    name: "Données d’impact",
    exact: true,
  });
  const finance = page.getByRole("link", { name: "Financement", exact: true });
  const consumption = page.getByRole("region", {
    name: "Consommation énergétique avant travaux",
    exact: true,
  });
  const initialSignal = consumption.getByRole("note", {
    name: "Anomalie détectée",
  });

  await page.goto("/projets/demo");
  await expect(
    page.getByRole("link", { name: /l’école des Tilleuls/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: title }).click();

  for (const view of ["porteur", "instructeur"] as const) {
    await test.step(`La vue ${view} montre la piscine, ses mesures et ses paiements`, async () => {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
      await expect(
        page
          .getByRole("region", { name: "Synthèse du projet" })
          .getByText("COMMUNE DE NANTES", { exact: true }),
      ).toBeVisible();
      await impact.click();
      await expect(consumption).toContainText(/2\s*055\s*650/);
      await expect(initialSignal).toBeVisible();
      await expect(
        page.getByRole("region", {
          name: "Consommation énergétique après travaux",
          exact: true,
        }),
      ).toContainText(/1\s*935\s*960/);

      await finance.click();
      await expect(page.getByText(/6\s*122\s*079,20\s*€/)).toBeVisible();
      for (const number of ["2105212345", "2106789012"]) {
        const engagement = page.getByRole("region", {
          name: `Engagement juridique n°${number}`,
        });
        await expect(
          engagement.getByText("Montant attribué initial"),
        ).toBeVisible();
        await engagement.getByRole("tab", { name: "Historique" }).click();
        const payments = engagement.getByRole("table");
        for (const year of ["2023", "2024", "2025"]) {
          await expect(
            payments.getByRole("row").filter({ hasText: year }).first(),
          ).toBeVisible();
        }
      }
      await expect(
        page.getByRole("cell", { name: "1009876546" }),
      ).toBeVisible();
    });

    if (view === "porteur") {
      await disclosure.click();
      await tools
        .getByRole("link", { name: "Passer en vue instructeur" })
        .click();
      await expect(page).toHaveURL(/\/102\/financement\?vue=instructeur$/);
      await summary.click();
    }
  }

  await test.step("L’instructeur change la réponse de la source et la retrouve sur les autres onglets", async () => {
    await impact.click();
    await expect(page).toHaveURL(/\/102\/impact\?vue=instructeur$/);
    await expect(initialSignal).toBeVisible();
    await disclosure.press("Enter");
    await page.keyboard.press("Tab");
    await expect(
      tools.getByRole("link", { name: "Passer en vue porteur" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(source).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      tools.getByRole("button", { name: "Réinitialiser la démo" }),
    ).toBeFocused();

    await source.selectOption("recalculated");
    await expect(initialSignal).toHaveCount(0);
    await expect(summary).toHaveAttribute(
      "href",
      "/projets/demo/102?vue=instructeur&fondsVert=recalculated",
    );
    await expect(finance).toHaveAttribute(
      "href",
      "/projets/demo/102/financement?vue=instructeur&fondsVert=recalculated",
    );
    await source.selectOption("unavailable");
    await expect(page.getByText(/temporairement indisponibles/)).toBeVisible();
    await expect(consumption).toBeVisible();

    await page.setViewportSize({ width: 375, height: 850 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(375);
    await page.screenshot({
      caret: "initial",
      path: testInfo.outputPath("piscine-outils-mobile.png"),
    });
    await source.selectOption("initial");
    await expect(initialSignal).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await finance.click();
    await expect(page.getByText(/6\s*122\s*079,20\s*€/)).toBeVisible();
    await page.screenshot({
      caret: "initial",
      path: testInfo.outputPath("piscine-financement-bureau.png"),
    });
    await page.setViewportSize({ width: 375, height: 850 });
    await page
      .getByText(/6\s*122\s*079,20\s*€/)
      .evaluate((amount) => amount.scrollIntoView({ block: "center" }));
    await expect(disclosure).toBeInViewport();
    await page.screenshot({
      animations: "disabled",
      caret: "initial",
      path: testInfo.outputPath("piscine-financement-mobile.png"),
    });
  });
});
