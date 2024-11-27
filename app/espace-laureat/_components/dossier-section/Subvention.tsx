import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";

import { NumerosEngagementJuridique } from "@/app/espace-laureat/_components/dossier-section/NumerosEngagementJuridique";
import { InfoBlock } from "@/components/info-block/InfoBlock";
import { ProgressBar } from "@/components/progress-bar/ProgressBar";

export const Subvention = ({
  intitule,
  resume,
  departementImplantation,
  numeroDossierAgenceEau,
  numeroEngagementJuridique,
  autresNumerosEngagementJuridique,
  montantSubventionAttribuee,
}: {
  intitule?: string;
  resume?: string;
  departementImplantation?: string;
  numeroDossierAgenceEau?: string;
  numeroEngagementJuridique?: string;
  autresNumerosEngagementJuridique: string[];
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
      {resume && <p className="text-gray-500">{resume}</p>}
      {departementImplantation && (
        <dl className="mb-4">
          <dt>Département d'implantation</dt>
          <dd>{departementImplantation}</dd>

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
              autresNumerosEngagementJuridique={
                autresNumerosEngagementJuridique
              }
            />
          )}

          {montantSubventionAttribuee && (
            <>
              <dt className="mb-1">Consommation de la subvention</dt>
              <dd>
                <ProgressBar
                  value={montantSubventionAttribuee}
                  max={montantSubventionAttribuee}
                  formattedMin="0 €"
                  formattedMax={formattedMontantSubventionAttribuee}
                />
                <div className="mb-4 bg-gray-100 py-3 px-4">
                  <span className="text-lg text-gray-900 font-semibold">
                    Restant : {formattedMontantSubventionAttribuee}
                  </span>
                  <p className="text-sm mb-0">
                    Vous pouvez obtenir une avance au démarrage des travaux à
                    hauteur de 30% maximum du montant de la subvention.{" "}
                    <a
                      className="fr-link fr-link--sm"
                      target="_blank"
                      href="https://www.ecologie.gouv.fr/fonds-vert"
                    >
                      En savoir plus
                    </a>
                  </p>
                </div>
              </dd>
            </>
          )}
        </dl>
      )}
      <div className="flex justify-end items-end">
        <Button>Demander un versement</Button>
      </div>
    </InfoBlock>
  );
};
