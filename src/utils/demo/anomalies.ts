import {
  readFondsVertSignals,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";

export type DemoSourceState = "initial" | "recalculated" | "unavailable";

export function readDemoSourceState(value: unknown): DemoSourceState {
  return value === "recalculated" || value === "unavailable"
    ? value
    : "initial";
}

export const demoInitialSignals = readFondsVertSignals({
  anomalies: {
    est_anomalie: true,
    est_error: true,
    anomalie_demarche_list: [],
    anomalie_indicateur_list: [
      "Consommation énergétique avant travaux",
      "Gain énergétique estimé (en %)",
    ],
    error_indicateur_list: ["Émissions de GES avant travaux"],
  },
  avertissements: [],
});

const demoRecalculatedSignals = readFondsVertSignals({
  anomalies: {
    est_anomalie: false,
    est_error: false,
    anomalie_demarche_list: [],
    anomalie_indicateur_list: [],
    error_indicateur_list: [],
  },
  avertissements: [],
});

export function demoSignals(state: DemoSourceState) {
  if (state === "unavailable") return unavailableFondsVertSignals();
  return state === "recalculated"
    ? demoRecalculatedSignals
    : demoInitialSignals;
}
