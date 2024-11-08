import { redirect } from "next/navigation";

import { getSession } from "@/utils/session";

export default async function EspaceLaureat() {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  return (
    <div className="max-w-2xl pb-24">
      <h1>Espace lauréat</h1>
      <p>{user.email}</p>
      <p className="fr-text--lead">
        Suivez vos subventions et réalisez une demande de versement.
      </p>
    </div>
  );
}
