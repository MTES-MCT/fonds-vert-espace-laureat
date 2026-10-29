import { expect, test } from "next/experimental/testmode/playwright/msw";

import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import { FONDS_VERT_TIMEOUT_MS } from "@/services/fondsvert/helpers";

import { fondsVertDossierData, fondsVertLoginData } from "./fixtures/fondsvert";

const originalFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const anomalies = {
  est_anomalie: true,
  est_error: false,
  anomalie_demarche_list: ["Démarche"],
  anomalie_indicateur_list: ["Libellé partenaire inconnu"],
  error_indicateur_list: [],
};

function mockFondsVert(
  reply: (url: URL, options?: RequestInit) => Response | Promise<Response>,
) {
  const requests: URL[] = [];
  globalThis.fetch = (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname.endsWith("/login")) {
      expect(options?.signal).toBeDefined();
      return Promise.resolve(Response.json(fondsVertLoginData));
    }
    requests.push(url);
    expect(options?.signal).toBeDefined();
    return Promise.resolve(reply(url, options));
  };
  return requests;
}

for (const includeMetrics of [true, false]) {
  test(`les anomalies restent chargées avec include_metrics=${includeMetrics}`, async () => {
    const requests = mockFondsVert(() =>
      Response.json({
        data: {
          ...fondsVertDossierData.data,
          anomalies,
          avertissements: ["Donnée manquante"],
        },
      }),
    );

    const result = await getDossierFondsVert({
      numeroDossier: 1,
      includeMetrics,
    });

    expect(result.success).toBe(true);
    expect(result.signals).toEqual({
      anomalies: { status: "loaded", data: anomalies, diagnostics: [] },
      avertissements: { status: "loaded", data: ["Donnée manquante"] },
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get("include_anomalies")).toBe("true");
    expect(requests[0].searchParams.get("include_metrics")).toBe(
      String(includeMetrics),
    );
  });
}

test("le repli 422 conserve les anomalies et les finances sans importer les métriques", async () => {
  const requests = mockFondsVert((url) =>
    url.searchParams.get("include_metrics") === "true"
      ? new Response(null, { status: 422 })
      : Response.json({ data: { ...fondsVertDossierData.data, anomalies } }),
  );

  const result = await getDossierFondsVert({
    numeroDossier: 1,
    includeMetrics: true,
  });

  expect(result).toMatchObject({
    success: true,
    metricsStatus: "unavailable",
    signals: { anomalies: { status: "loaded", data: anomalies } },
  });
  if (!result.success) throw new Error("Réponse attendue disponible");
  expect(result.data.information_financiere).toEqual(
    fondsVertDossierData.data.information_financiere,
  );
  expect(result.data.metrique_specifique).toBeUndefined();
  expect(
    requests.map((url) => [
      url.searchParams.get("include_metrics"),
      url.searchParams.get("include_anomalies"),
    ]),
  ).toEqual([
    ["true", "true"],
    ["false", "true"],
  ]);
});

for (const section of [undefined, null, { est_error: "false" }]) {
  test(`un volet anomalies ${JSON.stringify(section)} préserve finances et métriques`, async () => {
    mockFondsVert(() =>
      Response.json({
        data: { ...fondsVertDossierData.data, anomalies: section },
      }),
    );

    const result = await getDossierFondsVert({
      numeroDossier: 1,
      includeMetrics: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("Réponse attendue disponible");
    expect(result.data.information_financiere).toEqual(
      fondsVertDossierData.data.information_financiere,
    );
    expect(result.data.metrique_specifique).toEqual(
      fondsVertDossierData.data.metrique_specifique,
    );
    expect(result.signals.anomalies.status).toBe(
      section == null ? "absent" : "invalid",
    );
  });
}

for (const status of [401, 403, 404, 422, 503]) {
  test(`un refus ou échec FV ${status} ne devient pas une absence de signalement`, async () => {
    const requests = mockFondsVert(() => new Response(null, { status }));

    const result = await getDossierFondsVert({
      numeroDossier: 1,
      includeMetrics: false,
    });

    expect(result).toMatchObject({
      success: false,
      signals: {
        anomalies: { status: "unavailable" },
        avertissements: { status: "unavailable" },
      },
    });
    expect(requests).toHaveLength(1);
  });
}

for (const body of ["not json", "null", JSON.stringify({ data: [] })]) {
  test(`une enveloppe JSON invalide reste indisponible : ${body}`, async () => {
    mockFondsVert(() => new Response(body));

    const result = await getDossierFondsVert({
      numeroDossier: 1,
      includeMetrics: true,
    });

    expect(result).toMatchObject({
      success: false,
      signals: { anomalies: { status: "unavailable" } },
    });
  });
}

test("une attente FV est interrompue dans la borne réseau sans nouvelle tentative", async () => {
  const requests = mockFondsVert(
    (_url, options) =>
      new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener(
          "abort",
          () => reject(options.signal?.reason),
          { once: true },
        );
      }),
  );
  const started = performance.now();

  const result = await getDossierFondsVert({
    numeroDossier: 1,
    includeMetrics: true,
  });

  expect(result).toMatchObject({
    success: false,
    signals: { anomalies: { status: "unavailable" } },
  });
  expect(requests).toHaveLength(1);
  expect(performance.now() - started).toBeLessThan(
    FONDS_VERT_TIMEOUT_MS + 2000,
  );
});
