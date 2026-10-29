import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";
import { ReactNode } from "react";

import { EngagementsSection } from "@/app/projets/_components/dossier-section/details/EngagementsSection";
import { MetricsGrid } from "@/app/projets/_components/dossier-section/details/impact-details/MetricsGrid";
import { SubventionDetails } from "@/app/projets/_components/dossier-section/details/SubventionDetails";
import { StatutRealisation } from "@/app/projets/_components/dossier-section/StatutRealisation";
import {
  ProjectHolder,
  ProjectPresentation,
  SummaryHeader,
} from "@/app/projets/_components/dossier-section/Summary";
import { Timeline } from "@/app/projets/_components/dossier-section/Timeline";
import { RefreshIndicator } from "@/app/projets/_components/RefreshIndicator";
import { StartDsfrOnHydration } from "@/components/dsfr";
import type { DossierProgressTarget } from "@/db/dossierProgress";
import { Dossier } from "@/services/ds/subvention";
import {
  DossierFondsVert,
  InformationFinanciere,
  Metrics,
} from "@/services/fondsvert/dossier";
import { FinancesEJResult } from "@/services/fondsvert/finances";
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
  anomaliesSection,
  pageAction,
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
  anomaliesSection?: ReactNode;
  pageAction?: ReactNode;
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

  return (
    <div className="fr-container my-8">
      <div className="relative bg-white p-4 shadow-sm sm:p-8">
        <RefreshIndicator />
        {pageAction && (
          <div className="mb-4 flex justify-end">{pageAction}</div>
        )}
        <SummaryHeader
          intitule={subvention.intituleProjet}
          titreDemarche={dossierSubvention.demarche.title}
          anneeMillesime={socleCommun?.annee_millesime}
          numeroDossier={dossierSubvention.numero}
          backLink={backLink}
          pageLabel={projectPageLabels[section]}
          projectPath={
            section !== "summary" ? `${basePath}${navigationQuery}` : undefined
          }
        />
        <p className="mb-6 text-sm text-[var(--text-mention-grey)]">
          {view === "porteur"
            ? "Suivi de votre projet"
            : view === "instructeur"
              ? "Projet suivi"
              : "Projet"}
        </p>
        <nav
          aria-label="Pages du projet"
          className="mb-8 border-b border-[var(--border-default-grey)]"
        >
          <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-4 p-0 pb-4">
            <li>
              <Link
                href={`${basePath}${navigationQuery}`}
                aria-current={section === "summary" ? "page" : undefined}
              >
                Synthèse du projet
              </Link>
            </li>
            <li>
              <Link
                href={`${basePath}/impact${navigationQuery}`}
                aria-current={section === "impact" ? "page" : undefined}
              >
                Données d’impact
              </Link>
            </li>
            <li>
              <Link
                href={`${basePath}/financement${navigationQuery}`}
                aria-current={section === "finance" ? "page" : undefined}
              >
                Financement
              </Link>
            </li>
          </ul>
        </nav>

        {section === "impact" ? (
          <div className="space-y-8">
            <h2>Données d’impact</h2>
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
            <h2 id="finance-heading">Financement du projet</h2>
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
          <div className="flex flex-wrap items-start gap-8">
            <div className="flex w-full min-w-0 flex-col gap-y-4">
              <div>
                <div className="mb-6 border-b border-[var(--border-default-grey)] pb-6">
                  <StatutRealisation
                    dossierNumber={dossierSubvention.numero}
                    initialTarget={progressTarget}
                    correctionApiPath={progressApiPath}
                  />
                </div>
                {socleCommun && (
                  <Timeline
                    steps={[
                      {
                        label: "Dépôt du dossier",
                        date: socleCommun.date_depot,
                      },
                      {
                        label: "Notification",
                        date: socleCommun.date_notification,
                      },
                      {
                        label: "Début d'exécution",
                        date: socleCommun.date_debut_execution,
                      },
                      {
                        label: "Fin d'exécution",
                        date: socleCommun.date_fin_execution,
                      },
                    ]}
                  />
                )}
                <ProjectPresentation
                  resume={subvention.resumeProjet}
                  numeroDossierAgenceEau={subvention.numeroDossierAgenceEau}
                  departementImplantation={subvention.departementImplantation}
                  socleCommun={socleCommun}
                />
                <ProjectHolder
                  emailRepresentantLegal={subvention.emailRepresentantLegal}
                  emailResponsableSuivi={subvention.emailResponsableSuivi}
                  socleCommun={socleCommun}
                />
              </div>
            </div>
          </div>
        )}
        <Link
          className="fr-btn fr-btn--tertiary mt-8 bg-white"
          href={backLink.linkProps.href}
          data-testid="footer-back"
        >
          Retour
        </Link>
      </div>
      <StartDsfrOnHydration />
    </div>
  );
}
