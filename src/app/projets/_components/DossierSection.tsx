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
import type { DossierProgressTarget } from "@/db/dossierProgress";
import { Dossier } from "@/services/ds/subvention";
import {
  DossierFondsVert,
  InformationFinanciere,
} from "@/services/fondsvert/dossier";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import { projectListLabel, type ProjectView } from "@/utils/projectView";

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

  const { errorMessage, metriques, informationFinanciere, socleCommun } =
    dossierFondsVertResult.success
      ? {
          errorMessage: null,
          metriques: dossierFondsVertResult.data.metrique_specifique,
          informationFinanciere:
            dossierFondsVertResult.data.information_financiere,
          socleCommun: dossierFondsVertResult.data.socle_commun,
        }
      : {
          errorMessage: dossierFondsVertResult.error,
          metriques: {},
          informationFinanciere: undefined,
          socleCommun: undefined,
        };

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
              <Link href={basePath} aria-current="page">
                Synthèse du projet
              </Link>
            </li>
            <li>
              <Link href={`${basePath}#donnees-impact`}>Données d’impact</Link>
            </li>
            <li>
              <Link href={`${basePath}#financement`}>Financement</Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-wrap items-start gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-y-8">
            {anomaliesSection}

            <section
              id="financement"
              className="border-b border-[var(--border-default-grey)] pb-8"
            >
              <h3 className="mb-3">Financement du projet</h3>
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

            {metriques && Object.keys(metriques).length > 0 && (
              <div
                id="donnees-impact"
                className="pb-8"
                data-testid="impact-section"
              >
                <h3>Engagements écologiques</h3>
                <MetricsGrid metriques={metriques} />
              </div>
            )}

            <Link
              className="fr-btn fr-btn--tertiary bg-white"
              href={backLink.linkProps.href}
              data-testid="footer-back"
            >
              Retour
            </Link>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-y-4 lg:w-[22rem]">
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
                    { label: "Dépôt du dossier", date: socleCommun.date_depot },
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
      </div>
    </div>
  );
}
