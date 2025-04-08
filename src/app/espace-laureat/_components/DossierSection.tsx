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

  const { errorMessage, metriques, informationFinanciere } =
    dossierFondsVertResult.success
      ? {
          errorMessage: null,
          metriques: dossierFondsVertResult.data.metrique_specifique,
          informationFinanciere:
            dossierFondsVertResult.data.information_financiere,
        }
      : {
          errorMessage: dossierFondsVertResult.error,
          metriques: {},
          informationFinanciere: undefined,
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
      <div className="flex-1 flex flex-col gap-y-10">
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

        <MetricsGrid metriques={metriques} />

        <div>
          <div className="flex-1 p-4 sm:p-8 bg-white border border-gray-300 mb-4">
            <div className="flex justify-between items-end mb-3">
              <h3 className="mb-0">Subvention</h3>
              {informationFinanciere && (
                <div
                  className="text-xs text-gray-400 font-medium"
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
          <Link
            className="fr-btn fr-btn--tertiary bg-white xl:mb-20"
            href={backLink.linkProps.href}
            data-testid="footer-back"
          >
            Retour
          </Link>
        </div>
      </div>
      <div className="p-6 pt-10 bg-white shadow-lg max-w-xs xl:w-80 sticky top-8 text-center text-balance">
        <p className="text-xl font-semibold mb-2 text-gray-900">
          Les données de votre projet participent à la transition écologique
        </p>
        <CompletionSidebar
          numeroDossier={dossierSubvention.numero}
          impact={impact}
          metriques={metriques}
          nocache={nocache}
        />
      </div>
    </div>
  );
}
