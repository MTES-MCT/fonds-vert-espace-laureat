import { EmailLink } from "@/components/email-link/EmailLink";
import { InfoBlock } from "@/components/info-block/InfoBlock";

export const Profil = ({
  siret,
  emailRepresentantLegal,
  emailResponsableSuivi,
}: {
  siret: string;
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
}) => {
  return (
    <InfoBlock>
      <h2>Demandeur</h2>
      <dl>
        <dt>Numéro de Siret</dt>
        <dd>{siret}</dd>
        <dt>Représentant légal</dt>
        <dd>
          <EmailLink email={emailRepresentantLegal} />
        </dd>
        <dt>Responsable de suivi</dt>
        <dd>
          <EmailLink email={emailResponsableSuivi} />
        </dd>
      </dl>
    </InfoBlock>
  );
};
