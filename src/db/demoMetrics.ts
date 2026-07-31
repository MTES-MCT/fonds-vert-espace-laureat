import {
  getDossierMetricsSnapshot,
  importDossierMetricsIfMissing,
  resetDossierMetrics,
} from "@/db/dossierMetrics";
import { DEMO_DOSSIER_NUMBER, demoDossierFondsVert } from "@/utils/demo";

const demoMetrics = demoDossierFondsVert.metrique_specifique ?? {};

export async function getDemoDossierMetricsSnapshot() {
  let snapshot = await getDossierMetricsSnapshot({
    numeroDossier: DEMO_DOSSIER_NUMBER,
  });

  if (snapshot.status === "not-imported") {
    await importDossierMetricsIfMissing({
      numeroDossier: DEMO_DOSSIER_NUMBER,
      metrics: demoMetrics,
    });
    snapshot = await getDossierMetricsSnapshot({
      numeroDossier: DEMO_DOSSIER_NUMBER,
    });
  }

  return snapshot;
}

export async function resetDemoDossierMetrics() {
  await resetDossierMetrics({
    numeroDossier: DEMO_DOSSIER_NUMBER,
    metrics: demoMetrics,
  });

  return getDossierMetricsSnapshot({
    numeroDossier: DEMO_DOSSIER_NUMBER,
  });
}
