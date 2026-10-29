import {
  expect,
  graphql,
  http,
  HttpResponse,
  test,
} from "next/experimental/testmode/playwright/msw";

import { makeDossierDataWithNumber } from "./fixtures/ds";
import {
  fondsVertDossierData,
  fondsVertFinancesEJ1Data,
  fondsVertFinancesEJ2Data,
  fondsVertLoginData,
} from "./fixtures/fondsvert";
import { authenticatePage } from "./setup/auth";
import {
  deleteStoredDossierMetrics,
  getStoredDossierMetrics,
} from "./setup/db";

const ds = graphql.link("https://demarche.numerique.gouv.fr/api/v2/graphql");
const DOSSIER = 89996024;
const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

test("mesure le dossier autorisé avec DN 40 ms, FV 80 ms et EJ 30 ms", async ({
  page,
  msw,
}) => {
  test.setTimeout(90_000);
  await authenticatePage(page);
  await deleteStoredDossierMetrics(DOSSIER);
  let dossierCalls = 0;
  let ejCalls = 0;
  msw.use(
    ds.query("getDossier", async () => {
      await pause(40);
      return HttpResponse.json(makeDossierDataWithNumber(DOSSIER));
    }),
    http.post("http://fondsvert/fonds_vert/login", () =>
      HttpResponse.json(fondsVertLoginData),
    ),
    http.get(`http://fondsvert/fonds_vert/v2/dossiers/${DOSSIER}`, async () => {
      dossierCalls++;
      await pause(80);
      return HttpResponse.json(fondsVertDossierData);
    }),
    ...(
      [
        ["2105212345", fondsVertFinancesEJ1Data],
        ["2106789012", fondsVertFinancesEJ2Data],
      ] as const
    ).map(([number, data]) =>
      http.get(
        `http://fondsvert/fonds_vert/v2/finances/${number}`,
        async () => {
          ejCalls++;
          await pause(30);
          return HttpResponse.json(data);
        },
      ),
    ),
  );

  try {
    const durations: number[] = [];
    for (let pass = 0; pass < 6; pass++) {
      const started = performance.now();
      await page.goto(`/projets/${DOSSIER}`);
      await expect(
        page
          .getByRole("region", { name: "Engagement juridique n°2105212345" })
          .getByLabel("Montant attribué initial", { exact: true }),
      ).toContainText("10 073 574,00 €");
      if (pass > 0) durations.push(Math.round(performance.now() - started));
    }
    expect(dossierCalls).toBe(6);
    expect(ejCalls).toBe(12);
    const impactDurations: number[] = [];
    for (let pass = 0; pass < 6; pass++) {
      const started = performance.now();
      await page.goto(`/projets/${DOSSIER}/impact`);
      await expect(page.getByTestId("impact-section")).toBeVisible();
      if (pass > 0)
        impactDurations.push(Math.round(performance.now() - started));
    }
    expect(dossierCalls).toBe(12);
    expect(ejCalls).toBe(12);
    expect(Math.max(...impactDurations)).toBeLessThan(1500);
    console.log(
      "FV024 DETAIL",
      JSON.stringify({ durations, impactDurations, dossierCalls, ejCalls }),
    );
  } finally {
    await deleteStoredDossierMetrics(DOSSIER);
  }
});

test("un dossier existant refusé ne lance ni FV ni EJ ni import, puis son porteur importe ses métriques", async ({
  page,
  msw,
}) => {
  const dossierNumber = DOSSIER + 1;
  const ownerEmail = "porteur.client024@example.com";
  const dossierData = structuredClone(makeDossierDataWithNumber(dossierNumber));
  dossierData.data.dossier.usager.email = ownerEmail;
  let fvCalls = 0;
  let ejCalls = 0;
  const requestedOptions: (string | null)[][] = [];
  await deleteStoredDossierMetrics(dossierNumber);
  msw.use(
    ds.query("getDossier", async () => {
      await pause(80);
      return HttpResponse.json(dossierData);
    }),
    http.post("http://fondsvert/fonds_vert/login", () =>
      HttpResponse.json(fondsVertLoginData),
    ),
    http.get(
      `http://fondsvert/fonds_vert/v2/dossiers/${dossierNumber}`,
      ({ request }) => {
        fvCalls++;
        const options = new URL(request.url).searchParams;
        requestedOptions.push([
          options.get("include_metrics"),
          options.get("include_anomalies"),
        ]);
        return HttpResponse.json(fondsVertDossierData);
      },
    ),
    http.get(
      "http://fondsvert/fonds_vert/v2/finances/:number",
      ({ params }) => {
        ejCalls++;
        return HttpResponse.json(
          params.number === "2105212345"
            ? fondsVertFinancesEJ1Data
            : fondsVertFinancesEJ2Data,
        );
      },
    ),
  );

  try {
    await authenticatePage(page, { email: "sans-acces.client024@example.com" });
    for (const section of ["", "/impact"]) {
      await page.goto(`/projets/${dossierNumber}${section}`);
      await expect(
        page.getByText("Introuvable", { exact: true }),
      ).toBeVisible();
      expect(fvCalls).toBe(0);
      expect(ejCalls).toBe(0);
      expect(await getStoredDossierMetrics(dossierNumber)).toBeUndefined();
    }

    await authenticatePage(page, { email: ownerEmail });
    await page.goto(`/projets/${dossierNumber}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Rénovation",
    );
    await expect
      .poll(() => getStoredDossierMetrics(dossierNumber))
      .toBeDefined();
    expect(fvCalls).toBe(1);
    expect(ejCalls).toBe(2);
    expect(requestedOptions).toEqual([["true", "true"]]);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Rénovation",
    );
    expect(requestedOptions).toEqual([
      ["true", "true"],
      ["false", "true"],
    ]);
  } finally {
    await deleteStoredDossierMetrics(dossierNumber);
  }
});
