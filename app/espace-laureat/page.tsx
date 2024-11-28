import { redirect } from "next/navigation";

import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { getPageTitle } from "@/app/espace-laureat/_components/getPageTitle";
import {
  getSearchParams,
  SearchParams,
} from "@/app/espace-laureat/_components/getParams";
import { getDossierNumbers } from "@/utils/fondsvert";
import { getSession } from "@/utils/session";

export default async function EspaceLaureat({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  const params = await getSearchParams({ searchParams });

  const siret = params.siret ?? user.siret;

  const dossierNumbers =
    params.dossierNumbers.length > 0
      ? params.dossierNumbers
      : await getDossierNumbers({ siret });

  const dossierRequests = dossierNumbers.map((dossierNumber) =>
    getDossier({ dossierNumber, userEmail: user.email }),
  );

  const dossiers = await Promise.all(dossierRequests);
  const successDossiers = dossiers
    .filter((dossier) => dossier.success)
    .map((dossier) => dossier.data);

  return (
    <>
      <h1>{getPageTitle({ successDossiersLength: successDossiers.length })}</h1>

      {successDossiers.length === 0 ? (
        <div className="p-12 text-center text-balance text-gray-900 max-w-lg bg-gray-200">
          Nous ne trouvons pas de dossiers associés à l'email{" "}
          <span className="font-medium">{user.email}</span> et au siret{" "}
          <span className="font-medium">{siret}</span>.
        </div>
      ) : (
        <div className="flex flex-col gap-y-8">
          {successDossiers.map((dossier, index) => (
            <DossierSection key={index} dossier={dossier} />
          ))}{" "}
        </div>
      )}

      <p className="max-w-lg text-sm my-6">
        Vous ne trouvez pas votre dossier ? Assurez-vous de vous connecter avec
        l'adresse e-mail utilisée lors du dépôt de votre demande de subvention.
        Si vous avez besoin d'aide, n'hésitez pas à nous contacter.
      </p>
    </>
  );
}
