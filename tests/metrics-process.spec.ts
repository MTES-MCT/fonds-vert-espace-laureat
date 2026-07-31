import { expect, test } from "@playwright/test";

import { processMetrics } from "@/utils/metrics/process";

test("groups matching before and after metrics without changing their values", () => {
  expect(
    processMetrics({
      energy_before: {
        label: "Consommation énergétique avant travaux",
        unite: "kWh",
        valeur_estimee: 350000,
      },
      energy_after: {
        label: "Consommation énergétique après travaux",
        unite: "kWh",
        valeur_estimee: 280000,
      },
    }),
  ).toEqual({
    consommation_énergétique: {
      _typename: "AvantApresTravaux",
      beforeMetricCode: "energy_before",
      afterMetricCode: "energy_after",
      label: "Consommation énergétique",
      unite: "kWh",
      valeur_avant_travaux: 350000,
      valeur_apres_travaux: 280000,
    },
  });
});

test("keeps standalone metrics unchanged and ignores unsupported values", () => {
  expect(
    processMetrics({
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
  ).toEqual({
    valid: {
      _typename: "Simple",
      metricCode: "valid",
      label: "Gain énergétique estimé",
      unite: "%",
      valeur_estimee: 32,
    },
  });
});
