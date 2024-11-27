import { redirect } from "next/navigation";

import { Projet } from "@/app/espace-laureat/_components/Projet";
import { getDemoDossierNumber } from "@/utils/demo";
import { getSession } from "@/utils/session";

export default async function EspaceLaureat() {
  const session = await getSession();
  const user = session?.user;

  const demoDossierNumber = getDemoDossierNumber();

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  return <Projet dossierNumber={demoDossierNumber} />;
}
