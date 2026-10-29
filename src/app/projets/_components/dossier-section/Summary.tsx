import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Tag from "@codegouvfr/react-dsfr/Tag";
import type { ReactNode } from "react";

import { EmailLink } from "@/components/email-link/EmailLink";
import { SocleCommun } from "@/services/fondsvert/dossier";

export const SummaryHeader = ({
  intitule,
  titreDemarche,
  anneeMillesime,
  numeroDossier,
  backLink,
  pageLabel = "Synthèse du projet",
  projectPath,
}: {
  intitule?: string;
  titreDemarche: string;
  anneeMillesime?: number;
  numeroDossier: number;
  backLink: { label: string; linkProps: { href: string } };
  pageLabel?: string;
  projectPath?: string;
}) => {
  const mesureFondsVert = titreDemarche.replace("FONDS VERT - ", "");

  return (
    <header className="mb-8">
      <Breadcrumb
        className="mt-0 mb-4"
        homeLinkProps={{ href: "/" }}
        segments={
          projectPath
            ? [
                backLink,
                {
                  label: `Projet n°${numeroDossier}`,
                  linkProps: { href: projectPath },
                },
              ]
            : [backLink]
        }
        currentPageLabel={pageLabel}
        data-testid="breadcrumb-current"
      />
      <h1 className="mb-3 text-4xl font-bold text-balance [overflow-wrap:anywhere]">
        {intitule ?? "N/A"}
      </h1>
      <p className="mb-3 text-sm">Dossier n°{numeroDossier}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Tag small iconId="fr-icon-award-fill">
          {mesureFondsVert}
        </Tag>
        {anneeMillesime && (
          <Tag small iconId="fr-icon-calendar-2-line">
            Édition {anneeMillesime}
          </Tag>
        )}
      </div>
    </header>
  );
};

function ProjectFact({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt
        id={id}
        className="text-sm font-medium text-[var(--text-mention-grey)]"
      >
        {label}
      </dt>
      <dd
        aria-labelledby={id}
        className="m-0 min-w-0 text-sm [overflow-wrap:anywhere]"
      >
        {children}
      </dd>
    </div>
  );
}

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
}) => (
  <section
    aria-labelledby="project-presentation-heading"
    className="border-b border-[var(--border-default-grey)] pb-8"
  >
    <h3 id="project-presentation-heading" className="mb-4 text-xl">
      Présentation du projet
    </h3>
    {resume && (
      <p className="mb-6 whitespace-pre-line [overflow-wrap:anywhere]">
        {resume}
      </p>
    )}
    <dl className="mb-0 space-y-4">
      <ProjectFact id="department-label" label="Département d'implantation">
        {departementImplantation || "Aucun département précisé"}
      </ProjectFact>
      <ProjectFact id="commune-label" label="Commune principale impactée">
        {socleCommun?.nom_commune || "Non renseignée"}
      </ProjectFact>
      {numeroDossierAgenceEau && (
        <ProjectFact
          id="agency-number-label"
          label="Numéro de dossier agence de l'eau"
        >
          {numeroDossierAgenceEau}
        </ProjectFact>
      )}
    </dl>
  </section>
);

export const ProjectHolder = ({
  emailRepresentantLegal,
  emailResponsableSuivi,
  socleCommun,
  siret,
}: {
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
  socleCommun?: SocleCommun;
  siret?: string;
}) => (
  <section
    aria-labelledby="project-holder-heading"
    className="border-b border-[var(--border-default-grey)] pb-8"
  >
    <h3 id="project-holder-heading" className="mb-4 text-xl">
      Identité du porteur de projet
    </h3>
    <dl className="mb-0 space-y-4">
      <ProjectFact id="company-name-label" label="Nom du porteur">
        {socleCommun?.entreprise_raison_sociale || "Non renseigné"}
      </ProjectFact>
      <ProjectFact id="siret-label" label="SIRET">
        {socleCommun?.siret || siret || "Non renseigné"}
      </ProjectFact>
      <ProjectFact id="legal-rep-label" label="Représentant légal">
        <EmailLink email={emailRepresentantLegal} />
      </ProjectFact>
      <ProjectFact id="contact-label" label="Responsable du suivi">
        <EmailLink email={emailResponsableSuivi} />
      </ProjectFact>
    </dl>
  </section>
);
