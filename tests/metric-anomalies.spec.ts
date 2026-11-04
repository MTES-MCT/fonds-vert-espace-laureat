import { expect, test } from "@playwright/test";

import {
  readFondsVertSignals,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";
import type { MetricFields, MetricValue } from "@/services/fondsvert/dossier";
import { demoDossierFondsVert } from "@/utils/demo";
import {
  type FondsVertAnomalyTheme,
  normalizeFondsVertAnomalies,
  resolveEditableAnomalyTargets,
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
  sourcesLabel?: string;
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
    metricCodes: ["gain_energetique_estime_percentage"],
    sourcesLabel: "consommations avant et après travaux",
  },
  {
    label: "Gain énergétique estimé",
    themeId: "energy",
    metricCodes: ["gain_energetique_estime_percentage"],
    sourcesLabel: "consommations avant et après travaux",
  },
  {
    label: "Emissions de GES évitées (en %)",
    themeId: "ges",
    metricCodes: ["emission_ges_evitees_percentage"],
    sourcesLabel: "émissions de GES avant et après travaux",
  },
  {
    label: "Émissions de GES évitées",
    themeId: "ges",
    metricCodes: ["emission_ges_evitees_percentage"],
    sourcesLabel: "émissions de GES avant et après travaux",
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

for (const { label, themeId, metricCodes, sourcesLabel } of confirmedLabels) {
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
        sourcesLabel,
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
      metricCodes: ["gain_energetique_estime_percentage"],
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
  ).toEqual([
    "gain_energetique_estime_percentage",
    "gain_energetique_estime_percentage",
  ]);
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

for (const labels of [[], ["Donnée connue manquante"]]) {
  test(`la normalisation conserve des avertissements incomplets avec une liste ${labels.length === 0 ? "vide" : "de libellés connus"}`, () => {
    const signals = {
      anomalies: readFondsVertSignals({ anomalies: noSignals }).anomalies,
      avertissements: { status: "incomplete" as const, data: labels },
    };

    const normalized = normalizeFondsVertAnomalies(signals);

    expect(normalized.warnings).toEqual({ status: "incomplete", data: labels });
    if (!("data" in normalized.warnings))
      throw new Error("Libellés conservés attendus");
    normalized.warnings.data.push("Modification de la copie");
    expect(signals.avertissements.data).toEqual(labels);
    expect(signals.avertissements.data).not.toContain(
      "Modification de la copie",
    );
  });
}

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
  ).toEqual(["gain_energetique_estime_percentage"]);
});

function metric(label: string, value: MetricValue): MetricFields {
  return { label, unite: null, valeur_estimee: value };
}

const availableMetrics: Record<string, MetricFields> = {
  surface_batiment_m2_avant_projet: metric("Surface avant projet", 100),
  surface_batiment_m2_apres_projet: metric("Surface après projet", 120),
  conso_energetique_avant_travaux: metric("Consommation avant travaux", 1200),
  conso_energetique_apres_travaux: metric("Consommation après travaux", 800),
  emission_ges_avant_travaux: metric("Émissions avant travaux", 100),
  emission_ges_apres_travaux: metric("Émissions après travaux", 70),
  gain_energetique_estime_percentage: metric("Gain énergétique estimé", 33),
  emission_ges_evitees_percentage: metric("Émissions de GES évitées", 30),
  quantite_globale_annuel_biodechets_collectes: metric(
    "Biodéchets collectés",
    300,
  ),
};

for (const { label, metricCodes } of confirmedLabels) {
  test(`le signalement « ${label} » propose uniquement ses métriques disponibles`, () => {
    const normalized = normalize({
      ...noSignals,
      est_anomalie: true,
      anomalie_indicateur_list: [label],
    });
    const resolved = resolveEditableAnomalyTargets(
      normalized,
      availableMetrics,
    );

    expect(resolved.indicatorCount).toBe(1);
    expect(resolved.indicators[0]).toMatchObject({
      metricCodes,
      unavailableMetricCodes: [],
      editableTargets: metricCodes.map((metricCode) => ({
        metricCode,
        label: availableMetrics[metricCode].label,
      })),
    });
  });
}

for (const [label, metricCode, sourcesLabel] of [
  [
    "Gain énergétique estimé",
    "gain_energetique_estime_percentage",
    "consommations avant et après travaux",
  ],
  [
    "Émissions de GES évitées",
    "emission_ges_evitees_percentage",
    "émissions de GES avant et après travaux",
  ],
] as const) {
  test(`le ratio « ${label} » signalé désigne sa propre valeur et nomme ses valeurs sources`, () => {
    const normalized = normalize({
      ...noSignals,
      est_anomalie: true,
      est_error: true,
      anomalie_indicateur_list: [label],
      error_indicateur_list: [label],
    });

    expect(normalized.indicatorCount).toBe(1);
    expect(normalized.indicators[0]).toMatchObject({
      categories: ["statistical", "strong-inconsistency"],
      severity: "strong-inconsistency",
      metricCodes: [metricCode],
      sourcesLabel,
    });
  });
}

test("un ratio sans métrique disponible reste lisible sans lien inventé", () => {
  const normalized = normalize({
    ...noSignals,
    est_error: true,
    error_indicateur_list: ["Émissions de GES évitées"],
  });
  for (const metrics of [undefined, {}]) {
    const resolved = resolveEditableAnomalyTargets(normalized, metrics);
    expect(resolved.indicatorCount).toBe(1);
    expect(resolved.indicators[0]).toMatchObject({
      label: "Émissions de GES évitées",
      editableTargets: [],
      unavailableMetricCodes: ["emission_ges_evitees_percentage"],
    });
    expect(resolved.hasNoSignals).toBe(false);
  }
});

test("la surface après projet nulle de la démo est reconnue sans créer d’éditeur", () => {
  const label =
    "Surface du batiment après le projet. Donnée non disponible en 2024";
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    anomalie_indicateur_list: [label],
  });
  const resolved = resolveEditableAnomalyTargets(
    normalized,
    demoDossierFondsVert.metrique_specifique,
  );

  expect(resolved.indicatorCount).toBe(1);
  expect(resolved.indicators[0]).toMatchObject({
    label,
    themeId: "project",
    metricCodes: ["surface_batiment_m2_apres_projet"],
    editableTargets: [],
    unavailableMetricCodes: ["surface_batiment_m2_apres_projet"],
  });
});

for (const { situation, value } of [
  { situation: "nulle", value: null },
  {
    situation: "avec une valeur nulle",
    value: {
      label: "Consommation avant travaux",
      unite: "kWh",
      valeur_estimee: null,
    },
  },
  {
    situation: "sans valeur",
    value: { label: "Consommation avant travaux", unite: "kWh" },
  },
  {
    situation: "avec un libellé invalide",
    value: { label: 42, unite: "kWh", valeur_estimee: 10 },
  },
  {
    situation: "avec une unité invalide",
    value: {
      label: "Consommation avant travaux",
      unite: 42,
      valeur_estimee: 10,
    },
  },
  {
    situation: "avec une valeur objet",
    value: {
      label: "Consommation avant travaux",
      unite: "kWh",
      valeur_estimee: { value: 10 },
    },
  },
  {
    situation: "avec une valeur non finie",
    value: metric("Consommation avant travaux", Number.POSITIVE_INFINITY),
  },
  {
    situation: "avec une liste mixte",
    value: {
      label: "Consommation avant travaux",
      unite: "kWh",
      valeur_estimee: ["valide", 42],
    },
  },
  {
    situation: "marquée non disponible",
    value: metric("Consommation avant travaux — Donnée non disponible", 10),
  },
]) {
  test(`une métrique ${situation} ne devient pas une cible éditable`, () => {
    const normalized = normalize({
      ...noSignals,
      est_anomalie: true,
      anomalie_indicateur_list: ["Consommation énergétique avant travaux"],
    });
    const resolved = resolveEditableAnomalyTargets(normalized, {
      conso_energetique_avant_travaux: value,
    });

    expect(resolved.indicatorCount).toBe(1);
    expect(resolved.indicators[0].editableTargets).toEqual([]);
    expect(resolved.indicators[0].unavailableMetricCodes).toEqual([
      "conso_energetique_avant_travaux",
    ]);
  });
}

for (const { situation, value } of [
  { situation: "nombre zéro", value: 0 },
  { situation: "booléen faux", value: false },
  { situation: "texte", value: "Valeur reçue" },
  { situation: "liste de textes", value: ["École", "Mairie"] },
] satisfies { situation: string; value: MetricValue }[]) {
  test(`une valeur ${situation} prise en charge conserve sa cible existante`, () => {
    const normalized = normalize({
      ...noSignals,
      est_anomalie: true,
      anomalie_indicateur_list: ["Consommation énergétique avant travaux"],
    });
    const resolved = resolveEditableAnomalyTargets(normalized, {
      conso_energetique_avant_travaux: metric("Métrique existante", value),
    });

    expect(resolved.indicators[0].editableTargets).toEqual([
      {
        metricCode: "conso_energetique_avant_travaux",
        label: "Métrique existante",
      },
    ]);
    expect(resolved.indicators[0].unavailableMetricCodes).toEqual([]);
  });
}

for (const label of [
  "Consommation énergétique surfacique avant travaux",
  "Ménages : nombre d’habitants",
  "Consommation énergétique avant travaux, Émissions de GES avant travaux",
  "consommation énergétique avant travaux",
  "Emissions de GES avant travaux",
]) {
  test(`la présence de métriques ne crée pas de lien pour « ${label} »`, () => {
    const normalized = normalize({
      ...noSignals,
      est_error: true,
      error_indicateur_list: [label],
    });
    const resolved = resolveEditableAnomalyTargets(
      normalized,
      availableMetrics,
    );

    expect(resolved.indicatorCount).toBe(1);
    expect(resolved.indicators[0]).toMatchObject({
      label,
      themeId: null,
      metricCodes: [],
      editableTargets: [],
      unavailableMetricCodes: [],
    });
    expect(resolved.diagnostics).toContain("indicators:unmapped-label");
  });
}

test("un ratio signalé désigne son pourcentage existant sans modifier les autres métriques", () => {
  const normalized = normalize({
    ...noSignals,
    est_anomalie: true,
    anomalie_indicateur_list: [
      "Gain énergétique estimé",
      "Émissions de GES évitées",
    ],
  });
  const metrics = {
    ...availableMetrics,
    gain_energetique_estime_percentage: metric("Gain énergétique estimé", 33),
    emission_ges_evitees_percentage: metric("Émissions de GES évitées", 30),
    unknown_existing: metric("Métrique indépendante", true),
  };
  const before = structuredClone(metrics);
  Object.freeze(metrics);
  const resolved = resolveEditableAnomalyTargets(normalized, metrics);

  expect(resolved.indicatorCount).toBe(2);
  expect(
    resolved.indicators.flatMap((indicator) =>
      indicator.editableTargets.map((target) => target.metricCode),
    ),
  ).toEqual([
    "gain_energetique_estime_percentage",
    "emission_ges_evitees_percentage",
  ]);
  expect(metrics).toEqual(before);
  expect(metrics.gain_energetique_estime_percentage.valeur_estimee).toBe(33);
  expect(metrics.emission_ges_evitees_percentage.valeur_estimee).toBe(30);
});

test("les cibles absentes ne modifient ni l’état de réception ni le contexte ni les avertissements", () => {
  const normalized = normalize(
    {
      ...noSignals,
      est_anomalie: true,
      anomalie_indicateur_list: null,
      est_error: true,
      error_indicateur_list: ["Émissions de GES après travaux"],
      anomalie_demarche_list: ["Consommation énergétique avant travaux"],
    },
    ["Donnée manquante"],
  );
  const before = structuredClone(normalized);
  const resolved = resolveEditableAnomalyTargets(normalized, {});

  expect(resolved).toMatchObject({
    status: "incomplete",
    indicatorCount: 1,
    unspecifiedCategories: ["statistical"],
    contextLabels: ["Consommation énergétique avant travaux"],
    warnings: { status: "loaded", data: ["Donnée manquante"] },
    hasNoSignals: false,
  });
  expect(resolved.indicators[0]).toMatchObject({
    editableTargets: [],
    unavailableMetricCodes: ["emission_ges_apres_travaux"],
  });
  expect(normalized).toEqual(before);
});
