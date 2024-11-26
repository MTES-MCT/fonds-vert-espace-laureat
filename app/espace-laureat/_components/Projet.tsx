import { InfoBlock } from "@/components/info-block/InfoBlock";

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
  return (
    <InfoBlock>
      <h2 className="mb-0">{intitule ?? "N/A"}</h2>
      {resume && <p className="text-neutral-500">{resume}</p>}
      {departementImplantation && (
        <dl>
          <dt>Département d'implantation</dt>
          <dd>{departementImplantation}</dd>

          <dt>Montant de la subvention attribuée</dt>
          <dd>{montantSubventionAttribuee ?? "N/A"} €</dd>
        </dl>
      )}
    </InfoBlock>
  );
};
