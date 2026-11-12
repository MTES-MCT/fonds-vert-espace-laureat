import { expect, test } from "next/experimental/testmode/playwright/msw";

import {
  getAllDossierNumbers,
  getDossierNumbers,
} from "@/services/fondsvert/dossiers";

import { fondsVertLoginData } from "./fixtures/fondsvert";

const originalFetch = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const noSignals = {
  est_anomalie: false,
  est_error: false,
  anomalie_demarche_list: [],
  anomalie_indicateur_list: [],
  error_indicateur_list: [],
};
const dossier = (number: number, extra: Record<string, unknown> = {}) => ({
  socle_commun: { dossier_number: number },
  ...extra,
});
const envelope = (
  data: unknown,
  count: number,
  next: string | null = null,
) => ({ count, next_page: next, previous_page: null, data });

function mockFondsVert(reply: (url: URL) => Response | Promise<Response>) {
  const requests: URL[] = [];
  globalThis.fetch = (input) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.pathname.endsWith("/login"))
      return Promise.resolve(Response.json(fondsVertLoginData));
    requests.push(url);
    return Promise.resolve(reply(url));
  };
  return requests;
}

test("205 projets SIRET sont parcourus entièrement avec une source instructeur vide", async () => {
  const requests = mockFondsVert((url) => {
    if (!url.searchParams.has("siret")) return Response.json(envelope([], 0));
    const page = Number(url.searchParams.get("page"));
    const offset = (page - 1) * 100;
    const data = Array.from(
      { length: Math.min(100, 205 - offset) },
      (_, index) => dossier(1000 + offset + index, { anomalies: noSignals }),
    );
    return Response.json(
      envelope(
        data,
        205,
        page < 3
          ? `https://untrusted.example/collect?page=${page + 1}&siret=wrong&include_metrics=true`
          : null,
      ),
    );
  });

  const result = await getAllDossierNumbers({
    siret: "siret-initial",
    email: "instructeur@example.com",
  });

  expect(result.success).toBe(true);
  if (!result.success) throw new Error("Liste attendue disponible");
  expect(result.completeness).toBe("complete");
  expect(result.data).toHaveLength(205);
  expect(result.data.at(-1)).toBe(1204);
  expect(requests).toHaveLength(4);
  for (const url of requests) {
    expect(url.origin).toBe("http://fondsvert");
    expect(url.pathname).toBe("/fonds_vert/v2/dossiers");
    expect(url.searchParams.get("include_anomalies")).toBe("true");
    expect(url.searchParams.get("include_metrics")).toBe("false");
    expect(url.searchParams.get("include_finances")).toBe("false");
    expect(url.searchParams.get("per_page")).toBe("100");
    if (url.searchParams.has("siret"))
      expect(url.searchParams.get("siret")).toBe("siret-initial");
    else
      expect(url.searchParams.get("instructeur__instructeur_email")).toBe(
        "instructeur@example.com",
      );
  }
});

test("l’enveloppe objet conserve des synthèses nullables et des signaux inconnus", async () => {
  mockFondsVert(() =>
    Response.json(
      envelope(
        dossier(1, {
          socle_commun: {
            dossier_number: 1,
            nom_commune: null,
            annee_millesime: null,
            entreprise_raison_sociale: "Commune",
          },
          anomalies: {
            ...noSignals,
            est_anomalie: true,
            anomalie_indicateur_list: ["Indicateur inconnu"],
          },
          avertissements: ["Donnée attendue"],
        }),
        1,
      ),
    ),
  );

  const result = await getDossierNumbers({ siret: "siret" });

  expect(result).toMatchObject({
    success: true,
    completeness: "complete",
    summaries: {
      1: {
        socleCommun: {
          nom_commune: null,
          annee_millesime: null,
          entreprise_raison_sociale: "Commune",
        },
        signals: {
          anomalies: {
            status: "loaded",
            data: { anomalie_indicateur_list: ["Indicateur inconnu"] },
          },
          avertissements: { status: "loaded", data: ["Donnée attendue"] },
        },
      },
    },
  });
});

for (const absent of [undefined, null]) {
  test(`une section ${JSON.stringify(absent)} n’efface pas les signaux de la source voisine`, async () => {
    mockFondsVert((url) =>
      Response.json(
        envelope(
          [
            dossier(
              1,
              url.searchParams.has("siret")
                ? {
                    anomalies: {
                      ...noSignals,
                      est_error: true,
                      error_indicateur_list: ["Erreur SIRET"],
                    },
                    avertissements: ["Donnée SIRET"],
                  }
                : { anomalies: absent, avertissements: absent },
            ),
          ],
          1,
        ),
      ),
    );

    const result = await getAllDossierNumbers({
      siret: "siret",
      email: "instructeur@example.com",
    });

    expect(result).toMatchObject({
      success: true,
      data: [1],
      completeness: "complete",
      summaries: {
        1: {
          signals: {
            anomalies: {
              status: "loaded",
              data: {
                est_error: true,
                error_indicateur_list: ["Erreur SIRET"],
              },
            },
            avertissements: { status: "loaded", data: ["Donnée SIRET"] },
          },
        },
      },
    });
  });
}

test("deux sources divergentes conservent tous les libellés et qualifient leur ambiguïté", async () => {
  mockFondsVert((url) => {
    const source = url.searchParams.has("siret") ? "SIRET" : "instructeur";
    return Response.json(
      envelope(
        [
          dossier(1, {
            anomalies: {
              ...noSignals,
              est_error: true,
              error_indicateur_list: [`Erreur ${source}`],
            },
            avertissements: [`Attente ${source}`],
          }),
        ],
        1,
      ),
    );
  });

  const result = await getAllDossierNumbers({
    siret: "siret",
    email: "instructeur@example.com",
  });

  expect(result).toMatchObject({
    success: true,
    data: [1],
    summaries: {
      1: {
        signals: {
          anomalies: {
            status: "incomplete",
            data: {
              error_indicateur_list: ["Erreur SIRET", "Erreur instructeur"],
            },
            diagnostics: ["sources:conflicting-anomalies"],
          },
          avertissements: {
            status: "loaded",
            data: ["Attente SIRET", "Attente instructeur"],
          },
        },
      },
    },
  });
});

for (const invalidSource of ["SIRET", "instructeur"] as const) {
  for (const validWarnings of [[], ["Donnée connue manquante"]]) {
    test(`des avertissements invalides côté ${invalidSource} conservent l’incertitude et la liste valide ${validWarnings.length === 0 ? "vide" : "avec libellé"}`, async () => {
      mockFondsVert((url) => {
        const source = url.searchParams.has("siret") ? "SIRET" : "instructeur";
        return Response.json(
          envelope(
            [
              dossier(1, {
                anomalies: noSignals,
                avertissements:
                  source === invalidSource ? [false] : validWarnings,
              }),
            ],
            1,
          ),
        );
      });

      const result = await getAllDossierNumbers({
        siret: "siret",
        email: "instructeur@example.com",
      });

      expect(result).toMatchObject({
        success: true,
        summaries: {
          1: {
            signals: {
              avertissements: { status: "incomplete", data: validWarnings },
            },
          },
        },
      });
    });
  }
  test(`des avertissements invalides côté ${invalidSource} restent invalides si l’autre source ne les fournit pas`, async () => {
    mockFondsVert((url) => {
      const source = url.searchParams.has("siret") ? "SIRET" : "instructeur";
      return Response.json(
        envelope(
          [
            dossier(1, {
              anomalies: noSignals,
              avertissements: source === invalidSource ? [false] : null,
            }),
          ],
          1,
        ),
      );
    });

    const result = await getAllDossierNumbers({
      siret: "siret",
      email: "instructeur@example.com",
    });

    expect(result).toMatchObject({
      success: true,
      summaries: {
        1: {
          signals: {
            avertissements: { status: "invalid" },
          },
        },
      },
    });
    if (!result.success) throw new Error("Liste attendue disponible");
    expect(result.summaries[1].signals.avertissements).not.toHaveProperty(
      "data",
    );
  });
}

test("une page en panne conserve explicitement le premier résultat partiel", async () => {
  const requests = mockFondsVert((url) =>
    url.searchParams.get("page") === "1"
      ? Response.json(envelope([dossier(1)], 2, "?page=2"))
      : new Response(null, { status: 503 }),
  );

  const result = await getDossierNumbers({ siret: "siret" });

  expect(result).toMatchObject({
    success: true,
    data: [1],
    completeness: "partial",
  });
  if (!result.success) throw new Error("Résultat partiel attendu");
  expect(result.summaries[1].signals.anomalies.status).toBe("absent");
  expect(requests).toHaveLength(2);
});

for (const [situation, data] of [
  ["boucle de pagination", envelope([dossier(1)], 2, "?page=1")],
  ["compte incohérent", envelope([dossier(1)], 2)],
  ["page suivante invalide", envelope([dossier(1)], 2, "?page=0")],
  ["métadonnées absentes", { data: [dossier(1)] }],
  [
    "résumé invalide voisin",
    envelope([dossier(1), { socle_commun: { dossier_number: "2" } }], 2),
  ],
  ["doublon dans une source", envelope([dossier(1), dossier(1)], 2)],
] as const) {
  test(`${situation} ne déclare pas le résultat exhaustif`, async () => {
    const requests = mockFondsVert(() => Response.json(data));

    const result = await getDossierNumbers({ siret: "siret" });

    expect(result).toMatchObject({
      success: true,
      data: [1],
      completeness: "partial",
    });
    expect(requests).toHaveLength(1);
  });
}

test("un compte modifié pendant la pagination conserve les projets déjà reçus", async () => {
  mockFondsVert((url) =>
    Response.json(
      url.searchParams.get("page") === "1"
        ? envelope([dossier(1)], 2, "?page=2")
        : envelope([dossier(2)], 3),
    ),
  );

  const result = await getDossierNumbers({ siret: "siret" });

  expect(result).toMatchObject({
    success: true,
    data: [1, 2],
    completeness: "partial",
  });
});

test("une source indisponible et une source vide donnent un résultat partiel sans fausse exhaustivité", async () => {
  mockFondsVert((url) =>
    url.searchParams.has("siret")
      ? new Response(null, { status: 403 })
      : Response.json(envelope([], 0)),
  );

  const result = await getAllDossierNumbers({
    siret: "siret",
    email: "instructeur@example.com",
  });

  expect(result).toMatchObject({
    success: true,
    data: [],
    completeness: "partial",
  });
});

for (const [situation, response] of [
  ["HTTP 404", () => new Response(null, { status: 404 })],
  ["JSON invalide", () => new Response("invalid-json")],
  ["données nulles", () => Response.json({ data: null })],
] as const) {
  test(`une première page indisponible ne devient pas une liste vide : ${situation}`, async () => {
    mockFondsVert(response);

    const result = await getDossierNumbers({ siret: "siret" });

    expect(result.success).toBe(false);
  });
}

test("la découverte globale ne transmet aucun filtre de rattachement FV", async () => {
  const requests = mockFondsVert(() =>
    Response.json(envelope([dossier(7)], 1)),
  );

  const result = await getAllDossierNumbers({
    siret: "siret",
    email: "admin@example.com",
    global: true,
  });

  expect(result).toMatchObject({
    success: true,
    data: [7],
    completeness: "complete",
  });
  expect(requests).toHaveLength(1);
  expect(requests[0].searchParams.has("siret")).toBe(false);
  expect(requests[0].searchParams.has("instructeur__instructeur_email")).toBe(
    false,
  );
});
