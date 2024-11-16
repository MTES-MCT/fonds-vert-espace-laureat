import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";
import { redirect } from "next/navigation";

import { getDemoDossierNumber } from "@/utils/demo";
import { getSession } from "@/utils/session";

import { getDossier } from "./_components/getDossier";

export default async function EspaceLaureat() {
  const session = await getSession();
  const user = session?.user;

  const demoDossierNumber = getDemoDossierNumber();

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  const dossierResult = await getDossier(demoDossierNumber);

  if (!dossierResult.success) {
    return (
      <div className="max-w-xl">
        <Alert
          title="Impossible d'afficher ce dossier"
          description={dossierResult.error}
          severity="error"
        />
      </div>
    );
  }

  const dossier = dossierResult.data;

  const fr = {
    locale: frLocale,
  };

  const dateTraitement = format(dossier.dateTraitement, "dd MMMM yyyy", fr);
  const dateSignatureDecision = dossier.champs.dateSignatureDecision
    ? format(dossier.champs.dateSignatureDecision, "dd MMMM yyyy", fr)
    : "Non renseignée";

  return (
    <div className="max-w-2xl pb-24">
      <div>
        <h2>
          Dossier n°{dossier.numero} <Badge>{dossier.demarche.title}</Badge>
        </h2>
        <div className="bg-neutral-100 p-4 max-w-2xl">
          <h3 className="flex justify-between items-start text-lg leading-none mb-0">
            <span>{dossier.champs.intituleProjet}</span>
          </h3>
          <p className="text-neutral-500">{dossier.champs.resumeProjet}</p>
          <ul className="mb-0">
            <li>Siret du demandeur : {dossier.demandeur.siret}</li>
            <li>Date de signature de la décision : {dateSignatureDecision}</li>
            <li>Date de traitement : {dateTraitement}</li>
            <li>
              Montant de la subvention attribuée :{" "}
              {dossier.champs.montantSubventionAttribuee} €
            </li>
            <li>
              Département d'implantation :{" "}
              {dossier.champs.departementImplantation}
            </li>
            <li>
              Email du représentant légal :{" "}
              {dossier.champs.emailRepresentantLegal}
            </li>
            <li>
              Email du responsable de suivi :{" "}
              {dossier.champs.emailResponsableSuivi}
            </li>
            <li>
              Numéro de dossier agence de l'eau :{" "}
              {dossier.champs.numeroDossierAgenceEau}
            </li>
            <li>
              Numéros d'engagement juridique :
              <ul>
                <li>{dossier.champs.numeroEngagementJuridique}</li>
                {dossier.champs.autresNumerosEngagementJuridique?.map(
                  (num, index) => <li key={index}>{num}</li>,
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
