import { notFound } from "next/navigation";

import { AnomaliesSection } from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import {
  DossierSection,
  type ProjectSection,
} from "@/app/projets/_components/DossierSection";
import type { SearchParams } from "@/app/projets/_components/getParams";
import { startDossierMetricLoading } from "@/app/projets/_components/startDossierMetricLoading";
import { DemoToolsPanel } from "@/app/projets/demo/DemoToolsPanel";
import { demoUrl, readDemoView } from "@/app/projets/demo/navigation";
import { MetricAnomalyProvider } from "@/components/metrics/MetricAnomalyContext";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { ToastViewport } from "@/components/toast/toast";
import { getDossierProgress } from "@/db/dossierProgress";
import { completeDemoMetricSources } from "@/db/publicDemoWrites";
import { demoSignals, readDemoSourceState } from "@/utils/demo/anomalies";
import { demoProject } from "@/utils/demo/catalogue";
import { DEMO_POOL_NUMBER } from "@/utils/demo/reservation";
import { normalizeFondsVertAnomalies } from "@/utils/metrics/anomalies";
import { isDisplayableMetricFields } from "@/utils/metrics/guards";

export type CataloguePageProps = {
  params: Promise<{ dossierNumber: string }>;
  searchParams: SearchParams;
};

export async function CatalogueDossierPage({
  params,
  searchParams,
  section,
}: CataloguePageProps & { section: ProjectSection }) {
  const { dossierNumber } = await params;
  const query = await searchParams;
  const view = readDemoView(query.vue);
  const number = Number(dossierNumber);
  const project = String(number) === dossierNumber && demoProject(number, view);
  if (!project) notFound();

  const { dossier, fondsVert, status, finances } = project;
  const sourceState =
    number === DEMO_POOL_NUMBER
      ? readDemoSourceState(query.fondsVert)
      : undefined;
  const signals = sourceState ? demoSignals(sourceState) : project.signals;
  const unavailable =
    sourceState === "unavailable" ||
    (!fondsVert.metrique_specifique && section === "impact");
  const progressPromise = getDossierProgress({ numeroDossier: number });
  const loadMetrics = () =>
    startDossierMetricLoading({
      numeroDossier: number,
      loadDossierFondsVert: async (includeMetrics) =>
        unavailable
          ? {
              success: false,
              error: sourceState
                ? "Les données Fonds vert sont temporairement indisponibles."
                : "Les données d’impact sont temporairement indisponibles.",
              signals,
            }
          : {
              success: true,
              data: {
                ...fondsVert,
                metrique_specifique: includeMetrics
                  ? fondsVert.metrique_specifique
                  : undefined,
              },
              metricsStatus:
                includeMetrics && fondsVert.metrique_specifique
                  ? "loaded"
                  : "not-requested",
              signals,
            },
    }).resultPromise;
  let metricLoading = await loadMetrics();
  if (section === "impact" && !unavailable) {
    const missingMetrics = Object.entries(
      fondsVert.metrique_specifique ?? {},
    ).filter(
      ([code, metric]) =>
        isDisplayableMetricFields(metric) &&
        !metricLoading.metricRevisionTargets[code],
    );
    if (missingMetrics.length > 0) {
      await completeDemoMetricSources(
        number,
        Object.fromEntries(missingMetrics),
      );
      metricLoading = await loadMetrics();
    }
  }
  const { dossierFondsVertResult, metrics, metricRevisionTargets } =
    metricLoading;
  const progress = await progressPromise;
  const anomalies = normalizeFondsVertAnomalies(signals);
  const base = `/projets/demo/${number}`;
  const api = `/api/projets/demo/${number}`;
  const suffix =
    section === "summary"
      ? ""
      : section === "impact"
        ? "/impact"
        : "/financement";

  return (
    <>
      <ToastViewport />
      <MetricRevisionProvider
        dossierNumber={number}
        initialTargets={metricRevisionTargets}
        correctionApiPath={`${api}/metrics`}
      >
        <MetricAnomalyProvider anomalies={anomalies.indicators}>
          <DossierSection
            isAdmin={false}
            section={section}
            view={view}
            projectPath={base}
            listPath={demoUrl("/projets/demo", view)}
            navigationQuery={demoUrl("", view, sourceState)}
            dossierSubvention={dossier}
            dossierFondsVertResult={dossierFondsVertResult}
            financesEJPromise={Promise.resolve(finances ?? {})}
            metrics={metrics}
            progressTarget={
              progress.revision === 0 ? { ...progress, status } : progress
            }
            progressApiPath={`${api}/progress`}
            anomalies={anomalies}
            anomaliesSection={
              <AnomaliesSection
                anomalies={anomalies}
                sourceUnavailable={unavailable}
                hasLocalMetrics={Object.keys(metrics ?? {}).length > 0}
              />
            }
          />
        </MetricAnomalyProvider>
      </MetricRevisionProvider>
      <DemoToolsPanel
        state={sourceState}
        view={view}
        switchPath={
          demoProject(number, view === "porteur" ? "instructeur" : "porteur")
            ? base + suffix
            : "/projets/demo"
        }
      />
    </>
  );
}
