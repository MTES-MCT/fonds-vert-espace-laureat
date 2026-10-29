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

test("mesure la liste complète de 100 candidats par source, avec DN 15 ms", async ({
  page,
  msw,
}) => {
  test.setTimeout(120_000);
  await authenticatePage(page);
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
            socle_commun: { dossier_number: first + index },
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
      return HttpResponse.json(makeDossierDataWithNumber(variables.number));
    }),
    http.get("http://fondsvert/fonds_vert/v2/dossiers/:number", () => {
      detailCalls++;
      return new HttpResponse(null, { status: 500 });
    }),
  );

  const durations: number[] = [];
  const peaks: number[] = [];
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
    }
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
      durations,
      peaks,
      callsPerPass: calls,
      detailCalls,
      imported: 0,
    }),
  );
});
