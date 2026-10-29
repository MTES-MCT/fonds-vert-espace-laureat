import { readFondsVertSignals } from "@/services/fondsvert/anomalies";

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
