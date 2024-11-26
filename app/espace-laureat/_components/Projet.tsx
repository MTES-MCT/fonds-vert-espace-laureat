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
        <dl>
          <dt>Département d'implantation</dt>
          <dd>{departementImplantation}</dd>
          {montantSubventionAttribuee && (
            <>
              <dt className="mb-1">Versements</dt>
              <dd className="max-w-sm">
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
    </InfoBlock>
  );
};
