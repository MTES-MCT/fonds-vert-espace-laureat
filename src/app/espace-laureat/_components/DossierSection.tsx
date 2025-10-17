import Alert from "@codegouvfr/react-dsfr/Alert";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Link from "next/link";

import { MetricsGrid } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/MetricsGrid";
import { SubventionDetails } from "@/app/espace-laureat/_components/dossier-section/details/SubventionDetails";
import { Summary } from "@/app/espace-laureat/_components/dossier-section/Summary";
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
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-1 flex-col gap-y-10">
        <div>
          <Breadcrumb
            className="mt-0 mb-6"
            homeLinkProps={{
              href: "/",
            }}
            segments={[backLink]}
            currentPageLabel={`Dossier n°${dossierSubvention.numero}`}
            data-testid="breadcrumb-current"
          />
          <Summary
            intitule={subvention.intituleProjet}
            resume={subvention.resumeProjet}
            titreDemarche={dossierSubvention.demarche.title}
            numeroDossierAgenceEau={subvention.numeroDossierAgenceEau}
            emailRepresentantLegal={subvention.emailRepresentantLegal}
            emailResponsableSuivi={subvention.emailResponsableSuivi}
            departementImplantation={subvention.departementImplantation}
          />
        </div>

        <div>
          <div className="mb-4 flex-1 border border-gray-300 bg-white p-4 sm:p-8">
            <div className="mb-3 flex items-end justify-between">
              <h3 className="mb-0">Subvention</h3>
              {informationFinanciere && (
                <div
                  className="text-xs font-medium text-gray-400"
                  data-testid="chorus-number"
                >
                  Chorus n°
                  {informationFinanciere.centre_financier_chorus}
                </div>
              )}
            </div>
            {errorMessage && (
              <Alert severity="error" small description={errorMessage} />
            )}
            <SubventionDetails
              montantSubventionAttribuee={subvention.montantSubventionAttribuee}
              informationFinanciere={informationFinanciere}
            />
          </div>

          {metriques && Object.keys(metriques).length > 0 && (
            <div
              className="mb-4 flex-1 border border-gray-300 bg-white p-4 sm:p-8"
              data-testid="impact-section"
            >
              <h3>Impact</h3>
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
      </div>
      <div
        className={`
          sticky top-8 max-w-xs bg-white p-6 pt-10 text-center text-balance shadow-lg
          xl:w-80
        `}
      >
        <p className="mb-2 text-xl font-semibold text-gray-900">
          Les données de votre projet participent à la transition écologique
        </p>
        <CompletionSidebar
          numeroDossier={dossierSubvention.numero}
          impact={impact}
          metriques={metriques}
          socleCommun={socleCommun}
          nocache={nocache}
        />
      </div>
    </div>
  );
}
