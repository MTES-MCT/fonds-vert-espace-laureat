import Badge from "@codegouvfr/react-dsfr/Badge";

import { ImpactDetails } from "@/app/espace-laureat/_components/dossier-section/details/ImpactDetails";
import { NumerosEngagementJuridiqueDetails } from "@/app/espace-laureat/_components/dossier-section/details/NumerosEngagementJuridiqueDetails";
import { SubventionDetails } from "@/app/espace-laureat/_components/dossier-section/details/SubventionDetails";
import { InfoBlock } from "@/components/info-block/InfoBlock";
import { Impact } from "@/services/ds/impact";
import { Metrics } from "@/services/fondsvert/dossier";

export const Details = ({
  intitule,
  resume,
  departementImplantation,
  numeroDossierAgenceEau,
  numeroEngagementJuridique,
  autresNumerosEngagementJuridique,
  montantSubventionAttribuee,
  impact,
  metriquesResult,
}: {
  intitule?: string;
  resume?: string;
  departementImplantation?: string;
  numeroDossierAgenceEau?: string;
  numeroEngagementJuridique?: string;
  autresNumerosEngagementJuridique: string[];
  montantSubventionAttribuee?: number;
  impact?: Impact;
  metriquesResult:
    | { success: true; data: Metrics }
    | { success: false; error: string };
}) => {
  return (
    <InfoBlock>
      <h3 className="mb-2 text-base">{intitule ?? "N/A"}</h3>
      <p className="text-gray-500 text-sm">{resume ? resume : ""}</p>

      <dl>
        <>
          <dt>Département d'implantation</dt>
          <dd>
            {departementImplantation
              ? departementImplantation
              : "Aucun département précisé"}
          </dd>
        </>

        {numeroDossierAgenceEau && (
          <>
            <dt>Numéro de dossier agence de l'eau</dt>
            <dd>
              <Badge>{numeroDossierAgenceEau}</Badge>
            </dd>
          </>
        )}

        {(numeroEngagementJuridique ||
          autresNumerosEngagementJuridique.length > 0) && (
          <NumerosEngagementJuridiqueDetails
            numeroEngagementJuridique={numeroEngagementJuridique}
            autresNumerosEngagementJuridique={autresNumerosEngagementJuridique}
          />
        )}

        {montantSubventionAttribuee && (
          <>
            <dt className="mb-1">Subvention</dt>
            <dd className="bg-gray-100 p-4">
              <SubventionDetails
                montantSubventionAttribuee={montantSubventionAttribuee}
              />
            </dd>
          </>
        )}
        <dt className="mb-1">Impact du projet</dt>
        <dd className="bg-gray-100 p-4 pt-3">
          {metriquesResult.success ? (
            <ImpactDetails impact={impact} metriques={metriquesResult.data} />
          ) : (
            <>
              <p>{metriquesResult.error}</p>
              <ImpactDetails impact={impact} metriques={{}} />
            </>
          )}
        </dd>
      </dl>
    </InfoBlock>
  );
};
