import Badge from "@codegouvfr/react-dsfr/Badge";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmailLink } from "@/components/email-link/EmailLink";
import { SocleCommun } from "@/services/fondsvert/dossier";

export const SummaryHeader = ({
  intitule,
  titreDemarche,
  anneeMillesime,
  numeroDossier,
  holderName,
  backLink,
  pageLabel = "Synthèse du projet",
  projectPath,
  actions,
}: {
  intitule?: string;
  titreDemarche: string;
  anneeMillesime?: number;
  numeroDossier: number;
  holderName?: string;
  backLink: { label: string; linkProps: { href: string } };
  pageLabel?: string;
  projectPath?: string;
  actions?: ReactNode;
}) => {
  const mesureFondsVert = titreDemarche.replace("FONDS VERT - ", "");
  const context = [
    holderName,
    `Dossier n°${numeroDossier}`,
    mesureFondsVert,
    anneeMillesime ? `Édition ${anneeMillesime}` : undefined,
  ].filter(Boolean);

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
                  label: `Projet n°${numeroDossier}`,
                  linkProps: { href: projectPath },
                },
              ]
            : [backLink]
        }
        currentPageLabel={pageLabel}
        data-testid="breadcrumb-current"
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 grow">
          <h1 className="mb-2 text-balance [overflow-wrap:anywhere]">
            {intitule ?? "N/A"}
          </h1>
          <p
            className="mb-0 text-[var(--text-mention-grey)]"
            data-testid="project-context"
          >
            {context.map((item, index) => (
              <span key={item}>
                {index > 0 && <span aria-hidden="true">{" · "}</span>}
                {item}
              </span>
            ))}
          </p>
        </div>
        {actions && <div className="shrink-0 lg:max-w-1/3">{actions}</div>}
      </div>
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
    notice?: { label: string; severity: "error" | "warning" };
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
              <span aria-hidden="true">
                <Badge as="span" small noIcon severity={link.notice.severity}>
                  {link.notice.label}
                </Badge>
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
