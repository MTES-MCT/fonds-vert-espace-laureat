import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmailLink } from "@/components/email-link/EmailLink";
import { FactList, FactRow } from "@/components/fact-list/FactList";
import { SocleCommun } from "@/services/fondsvert/dossier";

export const SummaryHeader = ({
  intitule,
  numeroDossier,
  backLink,
  pageLabel,
  projectPath,
}: {
  intitule?: string;
  numeroDossier: number;
  backLink: { label: string; linkProps: { href: string } };
  pageLabel: string;
  projectPath?: string;
}) => {
  const projectLabel = `Projet n°${numeroDossier}`;

  return (
    <header>
      <Breadcrumb
        className="mt-0 mb-4"
        homeLinkProps={{ href: "/" }}
        segments={
          projectPath
            ? [
                backLink,
                {
                  label: projectLabel,
                  linkProps: { href: projectPath },
                },
              ]
            : [backLink]
        }
        currentPageLabel={projectPath ? pageLabel : projectLabel}
        data-testid="breadcrumb-current"
      />
      <h1 className="mb-0 text-balance [overflow-wrap:anywhere]">
        {intitule ?? "N/A"}
      </h1>
    </header>
  );
};

const noticeId = "project-page-notice";

export const ProjectPagesNav = ({
  links,
}: {
  links: {
    label: string;
    href: string;
    current: boolean;
    notice?: {
      label: string;
      count: number;
    };
  }[];
}) => (
  <nav
    aria-label="Pages du projet"
    className="mt-8 border-b border-[var(--border-default-grey)]"
  >
    <ul className="m-0 flex list-none gap-x-2 overflow-x-auto p-0">
      {links.map((link, index) => (
        <li key={link.href} className="p-0">
          <Link
            href={link.href}
            aria-current={link.current ? "page" : undefined}
            aria-describedby={link.notice ? `${noticeId}-${index}` : undefined}
            className={`
              flex items-center gap-2 border-b-2 bg-none px-4 py-3 font-medium whitespace-nowrap
              hover:bg-[var(--background-default-grey-hover)]
              ${
                link.current
                  ? `
                    border-[var(--border-active-blue-france)] text-[var(--text-active-blue-france)]
                  `
                  : "border-transparent text-[var(--text-default-grey)]"
              }
            `}
          >
            {link.label}
            {link.notice && (
              <span
                aria-hidden="true"
                className={`
                  inline-flex size-5 items-center justify-center rounded-full
                  bg-[var(--background-flat-error)] text-xs font-bold
                  text-[var(--text-inverted-error)]
                `}
              >
                {link.notice.count || "!"}
              </span>
            )}
          </Link>
          {link.notice && (
            <span id={`${noticeId}-${index}`} className="sr-only">
              {link.notice.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  </nav>
);

export const ProjectPresentation = ({
  numeroDossier,
  titreDemarche,
  anneeMillesime,
  resume,
  numeroDossierAgenceEau,
  departementImplantation,
  socleCommun,
  progress,
}: {
  numeroDossier: number;
  titreDemarche: string;
  anneeMillesime?: number;
  resume?: string;
  numeroDossierAgenceEau?: string;
  departementImplantation?: string;
  socleCommun?: SocleCommun;
  progress: ReactNode;
}) => (
  <section aria-labelledby="project-presentation-heading">
    <h3 id="project-presentation-heading" className="fr-h6 mb-3">
      Présentation du projet
    </h3>
    {resume && (
      <p className="mb-4 whitespace-pre-line [overflow-wrap:anywhere]">
        {resume}
      </p>
    )}
    <FactList>
      <FactRow id="dossier-number-label" label="Numéro de dossier">
        {numeroDossier}
      </FactRow>
      <FactRow id="measure-label" label="Dispositif">
        {titreDemarche.replace("FONDS VERT - ", "")}
      </FactRow>
      <FactRow id="edition-label" label="Édition">
        {anneeMillesime ?? "Non renseignée"}
      </FactRow>
      <FactRow id="department-label" label="Département d'implantation">
        {departementImplantation || "Aucun département précisé"}
      </FactRow>
      <FactRow id="commune-label" label="Commune principale impactée">
        {socleCommun?.nom_commune || "Non renseignée"}
      </FactRow>
      {numeroDossierAgenceEau && (
        <FactRow
          id="agency-number-label"
          label="Numéro de dossier agence de l'eau"
        >
          {numeroDossierAgenceEau}
        </FactRow>
      )}
      {progress}
    </FactList>
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
  <section aria-labelledby="project-holder-heading">
    <h3 id="project-holder-heading" className="fr-h6 mb-3">
      Identité du porteur de projet
    </h3>
    <FactList>
      <FactRow id="company-name-label" label="Nom du porteur">
        {socleCommun?.entreprise_raison_sociale || "Non renseigné"}
      </FactRow>
      <FactRow id="siret-label" label="SIRET">
        {socleCommun?.siret || siret || "Non renseigné"}
      </FactRow>
      <FactRow id="legal-rep-label" label="Représentant légal">
        <EmailLink email={emailRepresentantLegal} />
      </FactRow>
      <FactRow id="contact-label" label="Responsable du suivi">
        <EmailLink email={emailResponsableSuivi} />
      </FactRow>
    </FactList>
  </section>
);
