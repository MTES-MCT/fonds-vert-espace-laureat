import Badge from "@codegouvfr/react-dsfr/Badge";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";

import { NumerosEngagementJuridique } from "@/app/espace-laureat/_components/NumerosEngagementJuridique";
import { InfoBlock } from "@/components/info-block/InfoBlock";
import { ProgressBar } from "@/components/progress-bar/ProgressBar";

export const Juridique = ({
  dateSignatureDecision,
  dateTraitement,
  montantSubventionAttribuee,
  numeroDossierDemarchesSimplifiees,
  numeroDossierAgenceEau,
  numeroEngagementJuridique,
  autresNumerosEngagementJuridique,
}: {
  dateSignatureDecision?: Date;
  dateTraitement: Date;
  montantSubventionAttribuee?: number;
  numeroDossierDemarchesSimplifiees: number;
  numeroDossierAgenceEau?: string;
  numeroEngagementJuridique?: string;
  autresNumerosEngagementJuridique: string[];
}) => {
  const fr = {
    locale: frLocale,
  };

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
      <h2 className="flex justify-between items-start">
        Dossier n°{numeroDossierDemarchesSimplifiees}{" "}
        <Badge severity="success">Accepté</Badge>
      </h2>
      <dl>
        <dt className="mb-1">Montant de la subvention attribuée</dt>
        <dd className="max-w-sm">{formattedMontantSubventionAttribuee}</dd>

        <dt>Date de signature de la décision</dt>
        <dd>{formattedDateTraitement}</dd>

        <dt>Date de traitement</dt>
        <dd>{formattedDateSignatureDecision}</dd>

        {numeroDossierAgenceEau && (
          <>
            <dt>Numéro de dossier agence de l'eau</dt>
            <dd>
              <Badge>{numeroDossierAgenceEau}</Badge>
            </dd>
          </>
        )}
        {(numeroEngagementJuridique ||
          autresNumerosEngagementJuridique.length > 0) && (
          <NumerosEngagementJuridique
            numeroEngagementJuridique={numeroEngagementJuridique}
            autresNumerosEngagementJuridique={autresNumerosEngagementJuridique}
          />
        )}
      </dl>
    </InfoBlock>
  );
};
