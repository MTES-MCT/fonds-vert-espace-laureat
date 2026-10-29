import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { makeDossierDataWithNumber } from "./fixtures/ds";
import { fondsVertLoginData } from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import { createTestDatabaseClient } from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const FIRST_DOSSIER = 89994000;
const INSTRUCTEUR_EMAIL = "instructeur.performance@example.com";
const PORTEUR_EMAIL = "porteur.performance@example.com";

test("mesure la liste complète de 100 candidats par source, avec DN 15 ms", async ({
  page,
  msw,
}) => {
  test.setTimeout(120_000);
  await authenticatePage(page, { email: INSTRUCTEUR_EMAIL });
  let calls = 0;
  let active = 0;
  let peak = 0;
  let detailCalls = 0;
  msw.use(
    http.post("http://fondsvert/fonds_vert/login", () =>
      HttpResponse.json(fondsVertLoginData),
    ),
    http.get(
      /^http:\/\/fondsvert\/fonds_vert\/(?:v2\/)?dossiers$/,
      ({ request }) => {
        const first = new URL(request.url).searchParams.has("siret")
          ? FIRST_DOSSIER
          : FIRST_DOSSIER + 100;
        return HttpResponse.json({
          count: 100,
          next_page: null,
          previous_page: null,
          data: Array.from({ length: 100 }, (_, index) => ({
            socle_commun: {
              dossier_number: first + index,
              entreprise_raison_sociale:
                "Communauté de communes de la transition",
              nom_commune: "Commune du projet",
              annee_millesime: 2025,
            },
            anomalies: {
              est_anomalie: false,
              est_error: false,
              anomalie_demarche_list: [],
              anomalie_indicateur_list: [],
              error_indicateur_list: [],
            },
            avertissements: [],
          })),
        });
      },
    ),
    ds.query("getDossier", async ({ variables }) => {
      calls++;
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 15));
      active--;
      const response = makeDossierDataWithNumber(variables.number);
      return HttpResponse.json({
        data: {
          dossier: {
            ...response.data.dossier,
            usager: { email: PORTEUR_EMAIL },
            groupeInstructeur: { instructeurs: [{ email: INSTRUCTEUR_EMAIL }] },
          },
        },
      });
    }),
    http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () => {
      detailCalls++;
      return new HttpResponse(null, { status: 500 });
    }),
  );

  const measurements = [];
  for (const email of [PORTEUR_EMAIL, INSTRUCTEUR_EMAIL]) {
    await authenticatePage(page, { email });
    const durations: number[] = [];
    const peaks: number[] = [];
    const navigationTimings = [];
    for (let pass = 0; pass < 6; pass++) {
      calls = 0;
      peak = 0;
      const started = performance.now();
      await page.goto("/projets");
      await expect(page.getByRole("table").getByRole("row")).toHaveCount(201);
      expect(calls).toBe(200);
      expect(peak).toBeLessThanOrEqual(8);
      if (pass > 0) {
        durations.push(Math.round(performance.now() - started));
        peaks.push(peak);
        navigationTimings.push(
          await page.evaluate(() => {
            const timing = performance.getEntriesByType(
              "navigation",
            )[0] as PerformanceNavigationTiming;
            return {
              responseStart: Math.round(timing.responseStart),
              responseEnd: Math.round(timing.responseEnd),
              domInteractive: Math.round(timing.domInteractive),
              encodedBodySize: timing.encodedBodySize,
            };
          }),
        );
      }
    }
    expect(Math.max(...durations)).toBeLessThan(3000);
    measurements.push({ email, durations, peaks, navigationTimings });
  }
  expect(detailCalls).toBe(0);
  const sql = createTestDatabaseClient();
  try {
    const [stored] = await sql<
      { count: string }[]
    >`select count(*) from dossier_metric_revisions where dossier_number >= ${FIRST_DOSSIER} and dossier_number < ${FIRST_DOSSIER + 200}`;
    expect(Number(stored.count)).toBe(0);
  } finally {
    await sql.end();
  }
  console.log(
    "FV024 LIST",
    JSON.stringify({
      measurements,
      callsPerPass: calls,
      detailCalls,
      imported: 0,
    }),
  );
});
