import Button from "@codegouvfr/react-dsfr/Button";

import { InfoBlock } from "@/components/info-block/InfoBlock";
import { ProgressBar } from "@/components/progress-bar/ProgressBar";

export const Projet = ({
  intitule,
  resume,
  departementImplantation,
  montantSubventionAttribuee,
}: {
  intitule?: string;
  resume?: string;
  departementImplantation?: string;
  montantSubventionAttribuee?: number;
}) => {
  const formattedMontantSubventionAttribuee = montantSubventionAttribuee
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(montantSubventionAttribuee)
    : "N/A";

  return (
    <InfoBlock>
      <h2 className="mb-0">{intitule ?? "N/A"}</h2>
      {resume && <p className="text-neutral-500">{resume}</p>}
      {departementImplantation && (
        <dl className="mb-4">
          <dt>Département d'implantation</dt>
          <dd>{departementImplantation}</dd>
          {montantSubventionAttribuee && (
            <>
              <dt className="mb-1">Subvention et versements</dt>
              <dd className="max-w-sm">
                <p className="text-sm font-normal text-neutral-500 mb-1">
                  {formattedMontantSubventionAttribuee} restant à demander.
                </p>
                <ProgressBar
                  value={0}
                  formattedValue="0 €"
                  max={montantSubventionAttribuee}
                  formattedMax={formattedMontantSubventionAttribuee}
                />
              </dd>
            </>
          )}
        </dl>
      )}

      <div className="border-t-2 border-neutral-100 pt-4">
        <p className="text-sm mb-4">
          Vous pouvez demander le versement d'une avance au démarrage des
          travaux à hauteur de 30% maximum du montant de la subvention.
        </p>
        <div className="flex justify-between items-end">
          <Button
            priority="tertiary"
            linkProps={{
              target: "_blank",
              href: "https://www.ecologie.gouv.fr/fonds-vert",
            }}
          >
            En savoir plus
          </Button>
          <Button className="self-end">Demander un versement</Button>
        </div>
      </div>
    </InfoBlock>
  );
};
