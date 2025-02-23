import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { EmailLink } from "@/components/email-link/EmailLink";

export const Summary = ({
  intitule,
  resume,
  titreDemarche,
  numeroDossierDemarchesSimplifiees,
  numeroDossierAgenceEau,
  emailRepresentantLegal,
  emailResponsableSuivi,
  departementImplantation,
}: {
  intitule?: string;
  resume?: string;
  titreDemarche: string;
  numeroDossierDemarchesSimplifiees: number;
  numeroDossierAgenceEau?: string;
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
  departementImplantation?: string;
}) => {
  const mesureFondsVert = titreDemarche.replace("FONDS VERT - ", "");

  return (
    <div>
      <h2 className="flex flex-wrap items-center gap-4">
        Dossier n°{numeroDossierDemarchesSimplifiees}{" "}
        <Tag small className="bg-white shadow" iconId="fr-icon-award-fill">
          {mesureFondsVert}
        </Tag>
      </h2>
      <div>
        <p className="mb-4 max-w-5xl text-gray-900 text-balance font-medium">
          {intitule ?? "N/A"}
        </p>
        {resume && (
          <p
            title={resume}
            className="text-gray-700 text-sm max-w-2xl line-clamp-3"
          >
            {resume}
          </p>
        )}
        <dl className="flex flex-wrap text-sm gap-x-8 gap-y-4">
          <div>
            <dt>Représentant légal</dt>
            <dd>
              <EmailLink email={emailRepresentantLegal} />
            </dd>
          </div>
          <div>
            <dt>Responsable de suivi</dt>
            <dd>
              <EmailLink email={emailResponsableSuivi} />
            </dd>
          </div>
          <div>
            <dt>Département d'implantation</dt>
            <dd>
              {departementImplantation
                ? departementImplantation
                : "Aucun département précisé"}
            </dd>
          </div>
          {numeroDossierAgenceEau && (
            <div>
              <dt>Numéro de dossier agence de l'eau</dt>
              <dd>
                <Badge>{numeroDossierAgenceEau}</Badge>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};
