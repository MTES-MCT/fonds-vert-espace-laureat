import {
  getDossierMetricsSnapshot,
  importDossierMetricsIfMissing,
} from "@/db/dossierMetrics";
import type { getDossierFondsVert } from "@/services/fondsvert/dossier";

type DossierFondsVertResult = Awaited<ReturnType<typeof getDossierFondsVert>>;

export function startDossierMetricLoading({
  numeroDossier,
  loadDossierFondsVert,
}: {
  numeroDossier: number;
  loadDossierFondsVert: (
    includeMetrics: boolean,
  ) => Promise<DossierFondsVertResult>;
}) {
  const initialSnapshotPromise = getDossierMetricsSnapshot({ numeroDossier });
  const externalDossierPromise = initialSnapshotPromise.then((snapshot) =>
    loadDossierFondsVert(snapshot.status !== "imported"),
  );
  const resultPromise = Promise.all([
    initialSnapshotPromise,
    externalDossierPromise,
  ]).then(async ([initialSnapshot, externalDossierResult]) => {
    let finalSnapshot = initialSnapshot;

    if (
      initialSnapshot.status === "not-imported" &&
      externalDossierResult.success &&
      externalDossierResult.metricsStatus === "loaded"
    ) {
      await importDossierMetricsIfMissing({
        numeroDossier,
        metrics: externalDossierResult.data.metrique_specifique ?? {},
      });
      finalSnapshot = await getDossierMetricsSnapshot({ numeroDossier });
    }

    const localMetrics =
      finalSnapshot.status === "imported" ? finalSnapshot.metrics : undefined;
    const dossierFondsVertResult =
      externalDossierResult.success && localMetrics
        ? {
            success: true as const,
            data: {
              ...externalDossierResult.data,
              metrique_specifique: localMetrics,
            },
          }
        : externalDossierResult;

    return {
      dossierFondsVertResult,
      metricRevisionTargets: finalSnapshot.targets,
    };
  });

  return { externalDossierPromise, resultPromise };
}
