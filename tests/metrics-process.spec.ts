import { expect, test } from "@playwright/test";

import { orderMetrics } from "@/utils/metrics/process";

const metric = (label: string, valeur_estimee: number | string) => ({
  label,
  unite: null,
  valeur_estimee,
});

test("les valeurs avant et après travaux, leur ratio et les données liées se suivent quel que soit l’ordre reçu", () => {
  const ordered = orderMetrics({
    gain_energetique_estime_percentage: metric("Gain énergétique estimé", 32),
    conso_energetique_apres_travaux: metric(
      "Consommation énergétique après travaux",
      280000,
    ),
    type_surface: metric("Type de surface", "Surface habitable"),
    conso_energetique_avant_travaux: metric(
      "Consommation énergétique avant travaux",
      350000,
    ),
    surface_batiment_m2_avant_projet: metric(
      "Surface du bâtiment avant projet",
      4968,
    ),
  });

  expect(ordered.map(({ metricCode }) => metricCode)).toEqual([
    "conso_energetique_avant_travaux",
    "conso_energetique_apres_travaux",
    "gain_energetique_estime_percentage",
    "surface_batiment_m2_avant_projet",
    "type_surface",
  ]);
});

test("une valeur après travaux sans valeur avant garde son ratio juste après elle", () => {
  const ordered = orderMetrics({
    emission_ges_evitees_percentage: metric("Émissions de GES évitées", 38),
    nombre_habitant_collecte_separee: metric(
      "Nombre d'habitants concernés par la collecte séparée",
      66469,
    ),
    emission_ges_apres_travaux: metric("Émissions de GES après travaux", 383),
  });

  expect(ordered.map(({ metricCode }) => metricCode)).toEqual([
    "nombre_habitant_collecte_separee",
    "emission_ges_apres_travaux",
    "emission_ges_evitees_percentage",
  ]);
});

test("chaque valeur garde son libellé, son unité et sa valeur, et les valeurs non affichables sont ignorées", () => {
  expect(
    orderMetrics({
      valid: {
        label: "Gain énergétique estimé",
        unite: "%",
        valeur_estimee: 32,
      },
      invalid: {
        label: "Valeur indisponible",
        unite: null,
        valeur_estimee: null,
      },
    }),
  ).toEqual([
    {
      _typename: "Simple",
      metricCode: "valid",
      label: "Gain énergétique estimé",
      unite: "%",
      valeur_estimee: 32,
    },
  ]);
});
