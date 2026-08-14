import { resetDossierMetrics } from "@/db/dossierMetrics";
import { DEMO_DOSSIER_NUMBER, demoDossierFondsVert } from "@/utils/demo";

const demoMetrics = demoDossierFondsVert.metrique_specifique ?? {};

export async function resetDemoDossierMetrics() {
  await resetDossierMetrics({
    numeroDossier: DEMO_DOSSIER_NUMBER,
    metrics: demoMetrics,
  });
}
