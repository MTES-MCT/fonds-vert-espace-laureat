import Badge from "@codegouvfr/react-dsfr/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
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

  const dossier = await getDossier(demoDossierNumber);
  const dateTraitement = format(new Date(dossier.statut.date), "dd MMMM yyyy", {
    locale: fr,
  });

  return (
    <div className="max-w-2xl pb-24">
      <h1>Espace lauréat</h1>
      <div>
        <h2>Dossier n°{dossier.numero}</h2>
        <div className="bg-neutral-100 p-4 max-w-lg">
          <h3 className="flex justify-between items-start text-lg leading-none">
            <span>{dossier.champs.intituleProjet}</span>
            <Badge small className="ml-4 shrink-0" severity="success">
              {dossier.statut.label} le {dateTraitement}
            </Badge>
          </h3>

          <ul className="mb-0">
            <li>
              Montant de la subvention attribuée :{" "}
              {dossier.champs.montantSubventionAttribuee} €
            </li>
            <li>
              Numéro d'engagement juridique :{" "}
              {dossier.champs.numeroEngagementJuridique}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
