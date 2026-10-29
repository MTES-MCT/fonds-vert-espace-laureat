import { expect, test } from "@playwright/test";

import {
  readFondsVertSignals,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";
import {
  type FondsVertAnomalyTheme,
  normalizeFondsVertAnomalies,
} from "@/utils/metrics/anomalies";

const noSignals = {
  est_anomalie: false,
  est_error: false,
  anomalie_demarche_list: [] as string[],
  anomalie_indicateur_list: [] as string[],
  error_indicateur_list: [] as string[],
};

function normalize(anomalies: unknown, avertissements: unknown = []) {
  return normalizeFondsVertAnomalies(
    readFondsVertSignals({ anomalies, avertissements }),
  );
}

const confirmedLabels: {
  label: string;
  themeId: FondsVertAnomalyTheme;
  metricCodes: string[];
}[] = [
  {
    label: "Surface du bâtiment avant projet",
    themeId: "project",
    metricCodes: ["surface_batiment_m2_avant_projet"],
  },
  {
    label:
      "Surface de bâtiment concernée par l'opération en m² (avant projet et hors extension)",
    themeId: "project",
    metricCodes: ["surface_batiment_m2_avant_projet"],
  },
  {
    label: "Surface du batiment après le projet. Donnée non disponible en 2024",
    themeId: "project",
    metricCodes: ["surface_batiment_m2_apres_projet"],
  },
  {
    label: "Consommation énergétique avant travaux",
    themeId: "energy",
    metricCodes: ["conso_energetique_avant_travaux"],
  },
  {
    label: "Consommation énergétique avant travaux (en kWhEF/an)",
    themeId: "energy",
    metricCodes: ["conso_energetique_avant_travaux"],
  },
  {
    label: "Consommation énergétique après travaux",
    themeId: "energy",
    metricCodes: ["conso_energetique_apres_travaux"],
  },
  {
    label: "Consommation énergétique après travaux (en kWhEF/an)",
    themeId: "energy",
    metricCodes: ["conso_energetique_apres_travaux"],
  },
  {
    label: "Émissions de GES avant travaux",
    themeId: "ges",
    metricCodes: ["emission_ges_avant_travaux"],
  },
  {
    label: "Emissions GES initiales avant travaux (en kgEqCo2/an)",
    themeId: "ges",
    metricCodes: ["emission_ges_avant_travaux"],
  },
  {
    label: "Émissions de GES après travaux",
    themeId: "ges",
    metricCodes: ["emission_ges_apres_travaux"],
  },
  {
    label: "Emissions GES initiales après travaux (en kgEqCo2/an)",
    themeId: "ges",
    metricCodes: ["emission_ges_apres_travaux"],
  },
  {
    label: "Gain énergétique estimé (en %)",
    themeId: "energy",
    metricCodes: [
      "conso_energetique_avant_travaux",
      "conso_energetique_apres_travaux",
    ],
  },
  {
    label: "Gain énergétique estimé",
    themeId: "energy",
    metricCodes: [
      "conso_energetique_avant_travaux",
      "conso_energetique_apres_travaux",
    ],
  },
  {
    label: "Emissions de GES évitées (en %)",
    themeId: "ges",
    metricCodes: ["emission_ges_avant_travaux", "emission_ges_apres_travaux"],
  },
  {
    label: "Émissions de GES évitées",
    themeId: "ges",
    metricCodes: ["emission_ges_avant_travaux", "emission_ges_apres_travaux"],
  },
  {
    label: "Quantité globale de biodéchets collectés visée (en t/an)",
    themeId: "separate-collection",
    metricCodes: ["quantite_globale_annuel_biodechets_collectes"],
  },
  {
    label: "Quantité annuelle globale de biodéchets collectés",
    themeId: "separate-collection",
    metricCodes: ["quantite_globale_annuel_biodechets_collectes"],
  },
];

for (const { label, themeId, metricCodes } of confirmedLabels) {
  test(`le libellé exact « ${label} » conserve sa provenance et désigne ses codes confirmés`, () => {
    const normalized = normalize({
      ...noSignals,
      est_anomalie: true,
      anomalie_indicateur_list: [label],
    });

    expect(normalized.status).toBe("loaded");
    expect(normalized.indicatorCount).toBe(1);
    expect(normalized.hasNoSignals).toBe(false);
    expect(normalized.indicators).toEqual([
      {
        id: label,
        label,
        rawLabels: [label],
        categories: ["statistical"],
        severity: "statistical",
        themeId,
        metricCodes,
        provenance: "fonds-vert",
      },
    ]);
  });
}

test("un même indicateur dans deux catégories compte une fois et garde les deux informations", () => {
  const label = "Consommation énergétique avant travaux";
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    est_error: true,
    anomalie_indicateur_list: [label, label],
    error_indicateur_list: [label, label],
  });

  expect(normalized.indicatorCount).toBe(1);
  expect(normalized.indicators[0]).toMatchObject({
    rawLabels: [label],
    categories: ["statistical", "strong-inconsistency"],
    severity: "strong-inconsistency",
    metricCodes: ["conso_energetique_avant_travaux"],
  });
  expect(normalized.unspecifiedCategories).toEqual([]);
});

test("NFC et les espaces de bord rapprochent les occurrences sans perdre leurs libellés bruts", () => {
  const canonical = "Émissions de GES avant travaux";
  const decomposed = `  ${canonical.normalize("NFD")}  `;
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    est_error: true,
    anomalie_indicateur_list: [decomposed],
    error_indicateur_list: [canonical],
  });

  expect(normalized.indicatorCount).toBe(1);
  expect(normalized.indicators[0]).toMatchObject({
    id: canonical,
    label: decomposed,
    rawLabels: [decomposed, canonical],
    categories: ["statistical", "strong-inconsistency"],
    metricCodes: ["emission_ges_avant_travaux"],
  });
});

test("la casse n’est pas une normalisation implicite du libellé ou du compteur", () => {
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    anomalie_indicateur_list: [
      "Gain énergétique estimé",
      "gain énergétique estimé",
    ],
  });

  expect(normalized.indicatorCount).toBe(2);
  expect(
    normalized.indicators.map(({ id, themeId, metricCodes }) => ({
      id,
      themeId,
      metricCodes,
    })),
  ).toEqual([
    {
      id: "Gain énergétique estimé",
      themeId: "energy",
      metricCodes: [
        "conso_energetique_avant_travaux",
        "conso_energetique_apres_travaux",
      ],
    },
    { id: "gain énergétique estimé", themeId: null, metricCodes: [] },
  ]);
});

test("deux libellés distincts d’un ratio comptent deux signalements et leurs liens ne gonflent pas le compteur", () => {
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    anomalie_indicateur_list: [
      "Gain énergétique estimé",
      "Gain énergétique estimé (en %)",
    ],
  });

  expect(normalized.indicatorCount).toBe(2);
  expect(
    normalized.indicators.flatMap((indicator) => indicator.metricCodes),
  ).toHaveLength(4);
  expect(
    normalized.indicators.flatMap((indicator) => indicator.metricCodes),
  ).not.toContain("gain_energetique_estime_percentage");
});

for (const label of [
  "Consommation énergétique surfacique avant travaux",
  "Consommation énergétique surfacique après travaux",
  "Ménages : nombre d’habitants",
  "Surface de bâtiment après projet",
  "Consommation énergétique avant travaux, Ménages : nombre d’habitants; autre indicateur",
  "Indicateur inconnu, alice@example.com",
]) {
  test(`le signalement sans correspondance « ${label} » reste entier sans code inventé`, () => {
    const normalized = normalize({
      ...noSignals,
      est_error: true,
      error_indicateur_list: [label],
    });

    expect(normalized.indicatorCount).toBe(1);
    expect(normalized.indicators).toEqual([
      {
        id: label,
        label,
        rawLabels: [label],
        categories: ["strong-inconsistency"],
        severity: "strong-inconsistency",
        themeId: null,
        metricCodes: [],
        provenance: "fonds-vert",
      },
    ]);
    expect(normalized.diagnostics).toEqual(["indicators:unmapped-label"]);
    expect(JSON.stringify(normalized.diagnostics)).not.toContain(label);
    expect(JSON.stringify(normalized.diagnostics)).not.toContain(
      "alice@example.com",
    );
  });
}

test("des flags positifs sans libellés restent des signaux globaux sans indicateur fictif", () => {
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    est_error: true,
  });

  expect(normalized).toMatchObject({
    status: "incomplete",
    indicatorCount: 0,
    indicators: [],
    unspecifiedCategories: ["statistical", "strong-inconsistency"],
    hasNoSignals: false,
  });
  expect(normalized.diagnostics).toContain("est_anomalie:contradictory-labels");
  expect(normalized.diagnostics).toContain("est_error:contradictory-labels");
});

test("un flag sans liste conserve son signal global et les indicateurs connus de l’autre catégorie", () => {
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    anomalie_indicateur_list: null,
    est_error: true,
    error_indicateur_list: ["Émissions de GES avant travaux"],
  });

  expect(normalized).toMatchObject({
    status: "incomplete",
    indicatorCount: 1,
    unspecifiedCategories: ["statistical"],
    hasNoSignals: false,
  });
  expect(normalized.indicators[0].categories).toEqual(["strong-inconsistency"]);
});

test("des flags négatifs contradictoires n’effacent pas les libellés reçus", () => {
  const normalized = normalize({
    ...noSignals,
    anomalie_indicateur_list: ["Gain énergétique estimé"],
    error_indicateur_list: ["Gain énergétique estimé"],
  });

  expect(normalized).toMatchObject({
    status: "incomplete",
    indicatorCount: 1,
    hasNoSignals: false,
  });
  expect(normalized.indicators[0].categories).toEqual([
    "statistical",
    "strong-inconsistency",
  ]);
});

test("les démarches sont du contexte, même si leur texte correspond à un indicateur connu", () => {
  const contextLabels = [
    "Gain énergétique estimé",
    "Contexte inconnu, avec virgule",
  ];
  const normalized = normalize({
    ...noSignals,
    anomalie_demarche_list: contextLabels,
  });

  expect(normalized).toMatchObject({
    status: "loaded",
    contextLabels,
    indicatorCount: 0,
    indicators: [],
    unspecifiedCategories: [],
    hasNoSignals: false,
  });
  expect(normalized.diagnostics).toEqual([]);
});

test("les avertissements restent séparés des anomalies et de leur mapping", () => {
  const warnings = [
    "Consommation énergétique avant travaux",
    "Donnée attendue absente",
  ];
  const normalized = normalize(noSignals, warnings);

  expect(normalized).toMatchObject({
    status: "loaded",
    indicatorCount: 0,
    indicators: [],
    warnings: { status: "loaded", data: warnings },
    hasNoSignals: true,
  });
});

test("aucun signalement exige une réponse complète, deux flags négatifs et trois listes vides", () => {
  expect(normalize(noSignals)).toMatchObject({
    status: "loaded",
    hasNoSignals: true,
    indicatorCount: 0,
  });

  for (const field of Object.keys(noSignals)) {
    for (const missing of [undefined, null]) {
      const normalized = normalize({ ...noSignals, [field]: missing });
      expect(normalized.status).toBe("incomplete");
      expect(normalized.hasNoSignals).toBe(false);
    }
  }
});

test("section absente, nulle, invalide ou indisponible ne signifie jamais aucun signalement", () => {
  for (const absent of [undefined, null])
    expect(normalize(absent)).toMatchObject({
      status: "absent",
      hasNoSignals: false,
      indicatorCount: 0,
    });
  expect(normalize(false)).toMatchObject({
    status: "invalid",
    hasNoSignals: false,
    indicatorCount: 0,
  });
  expect(
    normalizeFondsVertAnomalies(unavailableFondsVertSignals()),
  ).toMatchObject({
    status: "unavailable",
    hasNoSignals: false,
    indicatorCount: 0,
    warnings: { status: "unavailable" },
  });
});

test("une section invalide conserve ses indicateurs encore lisibles et leur catégorie", () => {
  const normalized = normalize({
    ...noSignals,
    est_anomalie: "true",
    est_error: true,
    error_indicateur_list: ["Émissions de GES après travaux"],
  });

  expect(normalized).toMatchObject({
    status: "invalid",
    indicatorCount: 1,
    hasNoSignals: false,
  });
  expect(normalized.indicators[0]).toMatchObject({
    categories: ["strong-inconsistency"],
    metricCodes: ["emission_ges_apres_travaux"],
  });
  expect(normalized.diagnostics).toContain("est_anomalie:invalid");
});

test("les états des avertissements sont conservés indépendamment de la section anomalies", () => {
  expect(normalize(noSignals, null).warnings).toEqual({ status: "absent" });
  expect(normalize(noSignals, [42]).warnings).toEqual({ status: "invalid" });
  expect(
    normalizeFondsVertAnomalies({
      anomalies: readFondsVertSignals({ anomalies: noSignals }).anomalies,
      avertissements: { status: "unavailable" },
    }).warnings,
  ).toEqual({ status: "unavailable" });
});

test("la normalisation ne modifie ni les sources ni le mapping des appels suivants", () => {
  const signals = readFondsVertSignals({
    anomalies: {
      ...noSignals,
      est_anomalie: true,
      anomalie_indicateur_list: ["Gain énergétique estimé"],
    },
    avertissements: ["Donnée manquante"],
  });
  const before = structuredClone(signals);
  Object.freeze(signals);
  Object.freeze(signals.anomalies);
  if ("data" in signals.anomalies) {
    Object.freeze(signals.anomalies.data);
    Object.freeze(signals.anomalies.data.anomalie_indicateur_list);
  }
  const normalized = normalizeFondsVertAnomalies(signals);
  normalized.indicators[0].metricCodes.push("inventé");
  normalized.contextLabels.push("inventé");
  if (normalized.warnings.status === "loaded")
    normalized.warnings.data.push("inventé");

  expect(signals).toEqual(before);
  expect(
    normalizeFondsVertAnomalies(signals).indicators[0].metricCodes,
  ).toEqual([
    "conso_energetique_avant_travaux",
    "conso_energetique_apres_travaux",
  ]);
});
