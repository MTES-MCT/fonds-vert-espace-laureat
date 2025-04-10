import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { EmailLink } from "@/components/email-link/EmailLink";

export const Summary = ({
  intitule,
  resume,
  titreDemarche,
  numeroDossierAgenceEau,
  emailRepresentantLegal,
  emailResponsableSuivi,
  departementImplantation,
}: {
  intitule?: string;
  resume?: string;
  titreDemarche: string;
  numeroDossierAgenceEau?: string;
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
  departementImplantation?: string;
}) => {
  const mesureFondsVert = titreDemarche.replace("FONDS VERT - ", "");

  return (
    <div data-testid="dossier-summary">
      <h2 className="flex flex-wrap items-center gap-4">
        <span data-testid="project-title">{intitule ?? "N/A"}</span>
        <Tag
          small
          className="bg-white shadow-sm"
          iconId="fr-icon-award-fill"
          data-testid="program-title"
        >
          {mesureFondsVert}
        </Tag>
      </h2>
      <div>
        {resume && (
          <p
            title={resume}
            className="text-gray-700 text-sm max-w-2xl line-clamp-3"
            data-testid="project-summary"
          >
            {resume}
          </p>
        )}
        <dl className="flex flex-wrap text-sm gap-x-8 gap-y-4">
          <div>
            <dt>Représentant légal</dt>
            <dd>
              <EmailLink
                email={emailRepresentantLegal}
                data-testid="legal-rep-email"
              />
            </dd>
          </div>
          <div>
            <dt>Responsable de suivi</dt>
            <dd>
              <EmailLink
                email={emailResponsableSuivi}
                data-testid="contact-email"
              />
            </dd>
          </div>
          <div>
            <dt>Département d'implantation</dt>
            <dd data-testid="department">
              {departementImplantation
                ? departementImplantation
                : "Aucun département précisé"}
            </dd>
          </div>
          {numeroDossierAgenceEau && (
            <div data-testid="agency-container">
              <dt>Numéro de dossier agence de l'eau</dt>
              <dd>
                <Badge
                  className="bg-white shadow-sm"
                  data-testid="agency-dossier-number"
                >
                  {numeroDossierAgenceEau}
                </Badge>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};
