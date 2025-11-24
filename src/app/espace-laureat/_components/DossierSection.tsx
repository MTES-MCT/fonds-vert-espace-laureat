import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";

import { MetricsGrid } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/MetricsGrid";
import { SubventionDetails } from "@/app/espace-laureat/_components/dossier-section/details/SubventionDetails";
import {
  ProjectHolder,
  ProjectPresentation,
  SummaryHeader,
} from "@/app/espace-laureat/_components/dossier-section/Summary";
import { Timeline } from "@/app/espace-laureat/_components/dossier-section/Timeline";
import { CompletionSidebar } from "@/app/espace-laureat/_components/impact/CompletionSidebar";
import { Impact } from "@/services/ds/impact";
import { Dossier } from "@/services/ds/subvention";
import { DossierFondsVert } from "@/services/fondsvert/dossier";

export async function DossierSection({
  isAdmin,
  dossierSubvention,
  dossierFondsVertResult,
  impact,
  nocache,
}: {
  isAdmin: boolean;
  dossierSubvention: Dossier;
  dossierFondsVertResult:
    | { success: false; error: string }
    | { success: true; data: DossierFondsVert };
  impact?: Impact;
  nocache: boolean;
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

  const backLink = isAdmin
    ? {
        label: `Tous les dossiers`,
        linkProps: {
          href: `/espace-laureat?siret=${dossierSubvention.demandeur.siret}`,
        },
      }
    : {
        label: "Tous mes dossiers",
        linkProps: {
          href: "/espace-laureat",
        },
      };

  return (
    <div>
      <SummaryHeader
        intitule={subvention.intituleProjet}
        titreDemarche={dossierSubvention.demarche.title}
        anneeMillesime={socleCommun?.annee_millesime}
        numeroDossier={dossierSubvention.numero}
        backLink={backLink}
      />

      <div className="fr-container -mt-32 mb-8 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-y-8">
          <section className="bg-white p-8 shadow-lg">
            <div className="mb-3 flex items-end justify-between">
              <h3 className="mb-0">Financement du projet</h3>
              {informationFinanciere && (
                <div
                  className="text-xs font-medium text-gray-400"
                  data-testid="chorus-number"
                >
                  Chorus n°{informationFinanciere.centre_financier_chorus}
                </div>
              )}
            </div>
            {errorMessage && (
              <Alert severity="error" small description={errorMessage} />
            )}
            <SubventionDetails
              montantSubventionAttribuee={subvention.montantSubventionAttribuee}
              totalDesDepenses={socleCommun?.total_des_depenses}
              informationFinanciere={informationFinanciere}
            />
          </section>

          {metriques && Object.keys(metriques).length > 0 && (
            <div
              className="bg-white p-8 shadow-lg"
              data-testid="impact-section"
            >
              <h3>Engagements écologiques</h3>
              <MetricsGrid metriques={metriques} />
            </div>
          )}

          <Link
            className="fr-btn fr-btn--tertiary bg-white xl:mb-20"
            href={backLink.linkProps.href}
            data-testid="footer-back"
          >
            Retour
          </Link>
        </div>

        <div className="w-[22rem] shrink-0 bg-white p-6 shadow-lg">
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
          <section aria-labelledby="evaluation-heading">
            <h3
              id="evaluation-heading"
              className="mb-3 text-left text-base font-medium text-[var(--text-label-grey)]"
            >
              Les données de votre projet participent à la transition écologique
            </h3>
            <CompletionSidebar
              numeroDossier={dossierSubvention.numero}
              impact={impact}
              metriques={metriques}
              socleCommun={socleCommun}
              nocache={nocache}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
