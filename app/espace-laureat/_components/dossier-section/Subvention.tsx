import Badge from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";

import { NumerosEngagementJuridique } from "@/app/espace-laureat/_components/dossier-section/NumerosEngagementJuridique";
import { InfoBlock } from "@/components/info-block/InfoBlock";
import { NonDisponible } from "@/components/non-disponible/NonDisponible";
import { ProgressBar } from "@/components/progress-bar/ProgressBar";

export const Subvention = ({
  dossierNumero,
  intitule,
  resume,
  departementImplantation,
  numeroDossierAgenceEau,
  numeroEngagementJuridique,
  autresNumerosEngagementJuridique,
  montantSubventionAttribuee,
}: {
  dossierNumero: number;
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
      <h3 className="mb-2 text-base">{intitule ?? "N/A"}</h3>
      <p className="text-gray-500 text-sm">{resume ? resume : ""}</p>

      <dl className="mb-4">
        <>
          <dt>Département d'implantation</dt>
          <dd>
            {departementImplantation
              ? departementImplantation
              : "Aucun département précisé"}
          </dd>
        </>

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

        {montantSubventionAttribuee && (
          <>
            <dt className="mb-1">Subvention</dt>
            <dd>
              <ProgressBar
                value={montantSubventionAttribuee}
                max={montantSubventionAttribuee}
                formattedMin="0 €"
                formattedMax={formattedMontantSubventionAttribuee}
              />
              <div className="mb-4 bg-gray-100 py-3 px-4">
                <div className="flex items-center gap-x-2 text-lg text-gray-900 font-semibold mb-1">
                  Consommé : <NonDisponible />
                </div>
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
      <div className="flex justify-end items-end">
        <Link
          className="fr-btn"
          href={`/espace-laureat/${dossierNumero}/demande-de-versement`}
        >
          Demander un versement
        </Link>
      </div>
    </InfoBlock>
  );
};
