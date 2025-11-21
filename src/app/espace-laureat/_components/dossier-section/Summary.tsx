import Badge from "@codegouvfr/react-dsfr/Badge";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { EmailLink } from "@/components/email-link/EmailLink";
import { SocleCommun } from "@/services/fondsvert/dossier";

export const SummaryHeader = ({
  intitule,
  titreDemarche,
  anneeMillesime,
  numeroDossier,
  backLink,
}: {
  intitule?: string;
  titreDemarche: string;
  anneeMillesime?: number;
  numeroDossier: number;
  backLink: { label: string; linkProps: { href: string } };
}) => {
  const mesureFondsVert = titreDemarche.replace("FONDS VERT - ", "");

  return (
    <div className="bg-[#efebe8]">
      <div className="fr-container pt-8 pb-12">
        <Breadcrumb
          className="mt-0 mb-4"
          homeLinkProps={{
            href: "/",
          }}
          segments={[backLink]}
          currentPageLabel={`Dossier n°${numeroDossier}`}
          data-testid="breadcrumb-current"
        />
        <div>
          <h1 className="mb-3 max-w-3xl text-4xl font-bold">
            {intitule ?? "N/A"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Tag
              small
              className="bg-white shadow-sm"
              iconId="fr-icon-award-fill"
            >
              {mesureFondsVert}
            </Tag>
            {anneeMillesime && (
              <Tag
                small
                className="bg-white shadow-sm"
                iconId="fr-icon-calendar-2-line"
              >
                Édition {anneeMillesime}
              </Tag>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Summary = ({
  resume,
  numeroDossierAgenceEau,
  emailRepresentantLegal,
  emailResponsableSuivi,
  departementImplantation,
  socleCommun,
}: {
  resume?: string;
  numeroDossierAgenceEau?: string;
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
  departementImplantation?: string;
  socleCommun?: SocleCommun;
}) => {
  return (
    <div className="space-y-6">
      <section className="bg-white p-6 shadow-sm">
        <h3>Présentation du projet</h3>
        {resume && (
          <p title={resume} className="line-clamp-3 max-w-2xl">
            {resume}
          </p>
        )}
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt id="department-label">Département d'implantation</dt>
            <dd aria-labelledby="department-label">
              {departementImplantation
                ? departementImplantation
                : "Aucun département précisé"}
            </dd>
          </div>
          {socleCommun?.nom_commune && (
            <div>
              <dt id="commune-label">Commune principale impactée</dt>
              <dd aria-labelledby="commune-label">{socleCommun.nom_commune}</dd>
            </div>
          )}
          {numeroDossierAgenceEau && (
            <div>
              <dt>Numéro de dossier agence de l'eau</dt>
              <dd>
                <Badge className="bg-white shadow-sm">
                  {numeroDossierAgenceEau}
                </Badge>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="bg-white p-6 shadow-sm">
        <h3>Identité du porteur de projet</h3>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {socleCommun?.entreprise_raison_sociale && (
            <div>
              <dt id="company-name-label">Nom du porteur</dt>
              <dd aria-labelledby="company-name-label">
                {socleCommun.entreprise_raison_sociale}
              </dd>
            </div>
          )}
          {socleCommun?.siret && (
            <div>
              <dt id="siret-label">SIRET</dt>
              <dd aria-labelledby="siret-label">{socleCommun.siret}</dd>
            </div>
          )}
          <div>
            <dt id="legal-rep-label">Représentant légal</dt>
            <dd aria-labelledby="legal-rep-label">
              <EmailLink email={emailRepresentantLegal} />
            </dd>
          </div>
          <div>
            <dt id="contact-label">Responsable du suivi</dt>
            <dd aria-labelledby="contact-label">
              <EmailLink email={emailResponsableSuivi} />
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
