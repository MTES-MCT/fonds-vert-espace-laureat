import Badge from "@codegouvfr/react-dsfr/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { redirect } from "next/navigation";

import { getDemoDossierNumber } from "@/utils/demo";
import { getSession } from "@/utils/session";

import { getDossier } from "./dossier";

export default async function EspaceLaureat() {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  const demoDossierNumber = getDemoDossierNumber();
  const dossier = await getDossier(demoDossierNumber);
  const dateTraitement = format(
    new Date(dossier.dateTraitement),
    "dd MMMM yyyy",
    { locale: fr },
  );

  return (
    <div className="max-w-2xl pb-24">
      <h1>Espace lauréat</h1>
      <div>
        <h2>Dossier n°{dossier.number}</h2>
        <Badge severity="success">
          {dossier.state} le {dateTraitement}
        </Badge>
      </div>
    </div>
  );
}
