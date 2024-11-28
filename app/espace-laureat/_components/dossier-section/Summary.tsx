import Tag from "@codegouvfr/react-dsfr/Tag";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";

import { EmailLink } from "@/components/email-link/EmailLink";
import { InfoBlock } from "@/components/info-block/InfoBlock";

export const Summary = ({
  titreDemarche,
  dateSignatureDecision,
  dateTraitement,
  montantSubventionAttribuee,
  numeroDossierDemarchesSimplifiees,
  emailRepresentantLegal,
  emailResponsableSuivi,
}: {
  titreDemarche: string;
  dateSignatureDecision?: Date;
  dateTraitement: Date;
  montantSubventionAttribuee?: number;
  numeroDossierDemarchesSimplifiees: number;
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
}) => {
  const fr = {
    locale: frLocale,
  };

  const mesureFondsVert = titreDemarche.replace("FONDS VERT - ", "");

  const formattedDateTraitement = format(dateTraitement, "dd MMMM yyyy", fr);
  const formattedDateSignatureDecision = dateSignatureDecision
    ? format(dateSignatureDecision, "dd MMMM yyyy", fr)
    : "Non renseignée";

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
      <h2>
        Dossier n°{numeroDossierDemarchesSimplifiees}{" "}
        <Tag iconId="fr-icon-award-fill">{mesureFondsVert}</Tag>
      </h2>

      <dl>
        <dt className="mb-1">Montant de la subvention attribuée</dt>
        <dd>{formattedMontantSubventionAttribuee}</dd>

        <dt>Date de signature de la décision</dt>
        <dd>{formattedDateTraitement}</dd>

        <dt>Date de traitement</dt>
        <dd>{formattedDateSignatureDecision}</dd>

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
