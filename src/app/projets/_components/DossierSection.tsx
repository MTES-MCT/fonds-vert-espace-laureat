import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { ReactNode } from "react";

import { EngagementsSection } from "@/app/projets/_components/dossier-section/details/EngagementsSection";
import { MetricsGrid } from "@/app/projets/_components/dossier-section/details/impact-details/MetricsGrid";
import { SubventionDetails } from "@/app/projets/_components/dossier-section/details/SubventionDetails";
import { StatutRealisation } from "@/app/projets/_components/dossier-section/StatutRealisation";
import {
  ProjectHolder,
  ProjectPagesNav,
  ProjectPresentation,
  SummaryHeader,
} from "@/app/projets/_components/dossier-section/Summary";
import { Timeline } from "@/app/projets/_components/dossier-section/Timeline";
import { RefreshIndicator } from "@/app/projets/_components/RefreshIndicator";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { fondsVertAnomalySummary } from "@/components/metrics/FondsVertAnomalyStatus";
import type { DossierProgressTarget } from "@/db/dossierProgress";
import { Dossier } from "@/services/ds/subvention";
import {
  DossierFondsVert,
  InformationFinanciere,
  Metrics,
} from "@/services/fondsvert/dossier";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import type { NormalizedFondsVertAnomalies } from "@/utils/metrics/anomalies";
import { projectListLabel, type ProjectView } from "@/utils/projectView";

export type ProjectSection = "summary" | "impact" | "finance";

const projectPageLabels: Record<ProjectSection, string> = {
  summary: "Synthèse du projet",
  impact: "Données d’impact",
  finance: "Financement",
};

function buildEngagementsSection(
  informationFinanciere: InformationFinanciere | undefined,
  financesEJPromise: Promise<FinancesEJResult>,
): ReactNode {
  if (
    !informationFinanciere ||
    !informationFinanciere.informations_engagement?.length
  ) {
    return null;
  }

  return (
    <EngagementsSection
      informationFinanciere={informationFinanciere}
      financesEJPromise={financesEJPromise}
    />
  );
}

export async function DossierSection({
  isAdmin,
  section = "summary",
  navigationQuery = "",
  metrics,
  view,
  dossierSubvention,
  dossierFondsVertResult,
  financesEJPromise,
  progressTarget,
  progressApiPath,
  anomalies,
  anomaliesSection,
}: {
  isAdmin: boolean;
  section?: ProjectSection;
  navigationQuery?: string;
  metrics?: Metrics;
  view?: ProjectView;
  dossierSubvention: Dossier;
  dossierFondsVertResult:
    | { success: false; error: string }
    | { success: true; data: DossierFondsVert };
  financesEJPromise: Promise<FinancesEJResult>;
  progressTarget: DossierProgressTarget;
  progressApiPath?: string;
  anomalies?: NormalizedFondsVertAnomalies;
  anomaliesSection?: ReactNode;
}) {
  const subvention = dossierSubvention.champs;

  const { errorMessage, informationFinanciere, socleCommun } =
    dossierFondsVertResult.success
      ? {
          errorMessage: null,
          informationFinanciere:
            dossierFondsVertResult.data.information_financiere,
          socleCommun: dossierFondsVertResult.data.socle_commun,
        }
      : {
          errorMessage: dossierFondsVertResult.error,
          informationFinanciere: undefined,
          socleCommun: undefined,
        };
  const metriques =
    metrics ??
    (dossierFondsVertResult.success
      ? dossierFondsVertResult.data.metrique_specifique
      : undefined);

  const backLink = {
    label: isAdmin ? "Tous les projets" : projectListLabel(view),
    linkProps: { href: "/projets" },
  };
  const basePath = progressApiPath
    ? "/projets/demo"
    : `/projets/${dossierSubvention.numero}`;
  const presentation = (
    <ProjectPresentation
      numeroDossier={dossierSubvention.numero}
      titreDemarche={dossierSubvention.demarche.title}
      anneeMillesime={socleCommun?.annee_millesime}
      resume={subvention.resumeProjet}
      numeroDossierAgenceEau={subvention.numeroDossierAgenceEau}
      departementImplantation={subvention.departementImplantation}
      progress={
        <StatutRealisation
          dossierNumber={dossierSubvention.numero}
          initialTarget={progressTarget}
          correctionApiPath={progressApiPath}
        />
      }
      socleCommun={socleCommun}
    />
  );
  const holder = (
    <ProjectHolder
      emailRepresentantLegal={subvention.emailRepresentantLegal}
      emailResponsableSuivi={subvention.emailResponsableSuivi}
      socleCommun={socleCommun}
      siret={dossierSubvention.demandeur.siret}
    />
  );
  const anomalySummary = anomalies && fondsVertAnomalySummary(anomalies);
  const impactNotice =
    anomalySummary &&
    (anomalySummary.severity === "error" ||
      anomalySummary.severity === "warning") &&
    anomalies.status !== "incomplete" &&
    anomalies.status !== "invalid"
      ? {
          label: anomalySummary.label,
          count: anomalies.indicatorCount,
        }
      : undefined;

  return (
    <div className="fr-container py-8">
      <div
        className="relative bg-white p-4 shadow-sm sm:p-8"
        data-testid="project-frame"
      >
        <RefreshIndicator />
        <SummaryHeader
          intitule={subvention.intituleProjet}
          numeroDossier={dossierSubvention.numero}
          backLink={backLink}
          pageLabel={projectPageLabels[section]}
          projectPath={
            section !== "summary" ? `${basePath}${navigationQuery}` : undefined
          }
        />
        <ProjectPagesNav
          links={[
            {
              label: projectPageLabels.summary,
              href: `${basePath}${navigationQuery}`,
              current: section === "summary",
            },
            {
              label: projectPageLabels.impact,
              href: `${basePath}/impact${navigationQuery}`,
              current: section === "impact",
              notice: impactNotice,
            },
            {
              label: projectPageLabels.finance,
              href: `${basePath}/financement${navigationQuery}`,
              current: section === "finance",
            },
          ]}
        />

        <div className="mt-8">
          {section === "impact" ? (
            <div id="signalements" className="space-y-8">
              <h2 className="sr-only">Données d’impact</h2>
              {anomaliesSection}
              {errorMessage && !anomaliesSection && (
                <Alert
                  severity="error"
                  small
                  description={
                    metriques && Object.keys(metriques).length > 0
                      ? "Les données Fonds vert sont temporairement indisponibles. Les valeurs déjà enregistrées restent consultables."
                      : "Les données Fonds vert sont temporairement indisponibles."
                  }
                />
              )}
              {metriques && Object.keys(metriques).length > 0 ? (
                <div data-testid="impact-section">
                  <MetricsGrid metriques={metriques} />
                </div>
              ) : (
                <p>Aucune donnée d’impact n’est disponible pour ce projet.</p>
              )}
            </div>
          ) : section === "finance" ? (
            <section id="financement" aria-labelledby="finance-heading">
              <h2 id="finance-heading" className="sr-only">
                Financement du projet
              </h2>
              {errorMessage && (
                <Alert severity="error" small description={errorMessage} />
              )}
              <SubventionDetails
                montantSubventionAttribuee={
                  socleCommun?.montant_subvention_attribuee
                }
                totalDesDepenses={socleCommun?.total_des_depenses}
                informationFinanciere={informationFinanciere}
                engagementsSection={buildEngagementsSection(
                  informationFinanciere,
                  financesEJPromise,
                )}
              />
            </section>
          ) : (
            <section aria-labelledby="summary-heading">
              <h2 id="summary-heading" className="sr-only">
                Synthèse du projet
              </h2>
              {errorMessage && (
                <Alert
                  className="mb-6"
                  severity="error"
                  small
                  description="Les données Fonds vert sont temporairement indisponibles."
                />
              )}
              <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-8">
                  {view === "instructeur" ? (
                    <>
                      {holder}
                      {presentation}
                    </>
                  ) : (
                    <>
                      {presentation}
                      {holder}
                    </>
                  )}
                </div>
                <div className="min-w-0 space-y-8">
                  <Timeline
                    steps={[
                      {
                        label: "Dépôt du dossier",
                        date: socleCommun?.date_depot ?? null,
                      },
                      {
                        label: "Notification",
                        date: socleCommun?.date_notification ?? null,
                      },
                      {
                        label: "Début d'exécution",
                        date: socleCommun?.date_debut_execution ?? null,
                      },
                      {
                        label: "Fin d'exécution",
                        date: socleCommun?.date_fin_execution ?? null,
                      },
                    ]}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
        <div className="mt-8 border-t border-[var(--border-default-grey)] pt-6">
          <Button
            priority="secondary"
            iconId="fr-icon-arrow-left-line"
            linkProps={{ href: backLink.linkProps.href }}
          >
            Revenir à la liste des projets
          </Button>
        </div>
      </div>
      <StartDsfrOnHydration />
    </div>
  );
}
