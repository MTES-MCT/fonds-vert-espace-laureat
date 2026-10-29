import { expect, test } from "next/experimental/testmode/playwright/msw";

import {
  readAnomalies,
  readAvertissements,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";

const noSignals = {
  est_anomalie: false,
  est_error: false,
  anomalie_demarche_list: [],
  anomalie_indicateur_list: [],
  error_indicateur_list: [],
};

test("une réponse complète distingue l’absence de signalement des libellés reçus", () => {
  expect(readAnomalies(noSignals)).toEqual({
    status: "loaded",
    data: noSignals,
    diagnostics: [],
  });

  const signals = {
    ...noSignals,
    est_anomalie: true,
    est_error: true,
    anomalie_demarche_list: ["Démarche inconnue"],
    anomalie_indicateur_list: [
      "Libellé inconnu, avec virgule; et point-virgule",
    ],
    error_indicateur_list: ["Valeur négative"],
  };
  expect(readAnomalies(signals)).toEqual({
    status: "loaded",
    data: signals,
    diagnostics: [],
  });
});

test("une section absente ou nulle ne devient pas une liste sans signalement", () => {
  expect(readAnomalies(undefined)).toEqual({ status: "absent" });
  expect(readAnomalies(null)).toEqual({ status: "absent" });
  expect(unavailableFondsVertSignals()).toEqual({
    anomalies: { status: "unavailable" },
    avertissements: { status: "unavailable" },
  });
});

test("les champs omis et nullables restent incomplets sans perdre les signaux connus", () => {
  for (const missing of [undefined, null]) {
    expect(
      readAnomalies({
        ...noSignals,
        est_error: true,
        error_indicateur_list: ["Erreur connue"],
        est_anomalie: missing,
      }),
    ).toMatchObject({
      status: "incomplete",
      data: {
        est_anomalie: null,
        est_error: true,
        error_indicateur_list: ["Erreur connue"],
      },
      diagnostics: ["est_anomalie:missing"],
    });
  }
});

for (const invalid of [
  false,
  [],
  "anomalies",
  { ...noSignals, est_error: "false" },
  { ...noSignals, error_indicateur_list: [42] },
]) {
  test(`un format anomalies invalide est diagnostiqué : ${JSON.stringify(invalid)}`, () => {
    expect(readAnomalies(invalid).status).toBe("invalid");
  });
}

test("les flags contradictoires conservent leur valeur sans inventer d’indicateur", () => {
  expect(readAnomalies({ ...noSignals, est_error: true })).toMatchObject({
    status: "incomplete",
    data: { est_error: true, error_indicateur_list: [] },
    diagnostics: ["est_error:contradictory-labels"],
  });
  expect(
    readAnomalies({
      ...noSignals,
      anomalie_indicateur_list: ["Anomalie connue"],
    }),
  ).toMatchObject({
    status: "incomplete",
    data: {
      est_anomalie: false,
      anomalie_indicateur_list: ["Anomalie connue"],
    },
  });
});

test("les démarches restent du contexte indépendant des indicateurs", () => {
  expect(
    readAnomalies({
      ...noSignals,
      anomalie_demarche_list: ["Contexte de démarche"],
    }),
  ).toMatchObject({ status: "loaded", diagnostics: [] });
});

test("les avertissements distinguent liste vide, libellés, absence et format invalide", () => {
  expect(readAvertissements([])).toEqual({ status: "loaded", data: [] });
  expect(readAvertissements(["Donnée attendue inconnue"])).toEqual({
    status: "loaded",
    data: ["Donnée attendue inconnue"],
  });
  expect(readAvertissements(null)).toEqual({ status: "absent" });
  expect(readAvertissements(undefined)).toEqual({ status: "absent" });
  expect(readAvertissements([false])).toEqual({ status: "invalid" });
});
