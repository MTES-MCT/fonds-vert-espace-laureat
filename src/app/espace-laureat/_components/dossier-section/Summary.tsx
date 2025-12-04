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
      <div className="fr-container pt-8 pb-40">
        <Breadcrumb
          className="mt-0 mb-4"
          homeLinkProps={{
            href: "/",
          }}
          segments={[backLink]}
          currentPageLabel={`Dossier n°${numeroDossier}`}
          data-testid="breadcrumb-current"
        />
        <div className="flex h-[116px] flex-col justify-center">
          <h1 className="mb-3 max-w-4xl text-4xl font-bold text-balance">
            {intitule && intitule.length > 80
              ? `${intitule.slice(0, 80)}...`
              : (intitule ?? "N/A")}
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

export const ProjectPresentation = ({
  resume,
  numeroDossierAgenceEau,
  departementImplantation,
  socleCommun,
}: {
  resume?: string;
  numeroDossierAgenceEau?: string;
  departementImplantation?: string;
  socleCommun?: SocleCommun;
}) => {
  return (
    <section
      aria-labelledby="project-presentation-heading"
      className="mb-6 border-b border-[var(--border-default-grey)] pb-6"
    >
      <h3
        id="project-presentation-heading"
        className="mb-3 text-left text-base font-medium text-[var(--text-label-grey)]"
      >
        Présentation du projet
      </h3>
      {resume && (
        <p
          title={resume}
          className="mb-4 line-clamp-3 text-xs text-[var(--text-default-grey)]"
        >
          {resume}
        </p>
      )}
      <dl className="space-y-2">
        <div>
          <dt
            id="department-label"
            className="text-xs font-medium text-[var(--text-mention-grey)]"
          >
            Département d'implantation
          </dt>
          <dd
            aria-labelledby="department-label"
            className="text-sm text-[var(--text-default-grey)]"
          >
            {departementImplantation
              ? departementImplantation
              : "Aucun département précisé"}
          </dd>
        </div>
        {socleCommun?.nom_commune && (
          <div>
            <dt
              id="commune-label"
              className="text-xs font-medium text-[var(--text-mention-grey)]"
            >
              Commune principale impactée
            </dt>
            <dd
              aria-labelledby="commune-label"
              className="text-sm text-[var(--text-default-grey)]"
            >
              {socleCommun.nom_commune}
            </dd>
          </div>
        )}
        {numeroDossierAgenceEau && (
          <div>
            <dt className="text-xs font-medium text-[var(--text-mention-grey)]">
              Numéro de dossier agence de l'eau
            </dt>
            <dd className="text-sm">
              <Badge className="bg-white shadow-sm">
                {numeroDossierAgenceEau}
              </Badge>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
};

export const ProjectHolder = ({
  emailRepresentantLegal,
  emailResponsableSuivi,
  socleCommun,
}: {
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
  socleCommun?: SocleCommun;
}) => {
  return (
    <section
      aria-labelledby="project-holder-heading"
      className="mb-6 border-b border-[var(--border-default-grey)] pb-6"
    >
      <h3
        id="project-holder-heading"
        className="mb-3 text-left text-base font-medium text-[var(--text-label-grey)]"
      >
        Identité du porteur de projet
      </h3>
      <dl className="space-y-2">
        {socleCommun?.entreprise_raison_sociale && (
          <div>
            <dt
              id="company-name-label"
              className="text-xs font-medium text-[var(--text-mention-grey)]"
            >
              Nom du porteur
            </dt>
            <dd
              aria-labelledby="company-name-label"
              className="text-sm text-[var(--text-default-grey)]"
            >
              {socleCommun.entreprise_raison_sociale}
            </dd>
          </div>
        )}
        {socleCommun?.siret && (
          <div>
            <dt
              id="siret-label"
              className="text-xs font-medium text-[var(--text-mention-grey)]"
            >
              SIRET
            </dt>
            <dd
              aria-labelledby="siret-label"
              className="text-sm text-[var(--text-default-grey)]"
            >
              {socleCommun.siret}
            </dd>
          </div>
        )}
        <div>
          <dt
            id="legal-rep-label"
            className="text-xs font-medium text-[var(--text-mention-grey)]"
          >
            Représentant légal
          </dt>
          <dd
            aria-labelledby="legal-rep-label"
            className="text-sm text-[var(--text-default-grey)]"
          >
            <EmailLink email={emailRepresentantLegal} />
          </dd>
        </div>
        <div>
          <dt
            id="contact-label"
            className="text-xs font-medium text-[var(--text-mention-grey)]"
          >
            Responsable du suivi
          </dt>
          <dd
            aria-labelledby="contact-label"
            className="text-sm text-[var(--text-default-grey)]"
          >
            <EmailLink email={emailResponsableSuivi} />
          </dd>
        </div>
      </dl>
    </section>
  );
};
