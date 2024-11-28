import { redirect } from "next/navigation";

import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import {
  demoStaticDossierNumber,
  getDemoDossierNumbers,
  getDemoStaticDossierResponse,
} from "@/utils/demo";
import { getDossierNumbers } from "@/utils/fondsvert";
import { getSession } from "@/utils/session";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EspaceLaureat({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  const user = session?.user;

  const { siret } = await searchParams;

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  const dossierNumbers =
    typeof siret === "string"
      ? await getDossierNumbers({ siret })
      : getDemoDossierNumbers();

  const dossierRequests = dossierNumbers.map((dossierNumber) =>
    dossierNumber === demoStaticDossierNumber
      ? getDemoStaticDossierResponse()
      : getDossier({ dossierNumber, userEmail: user.email }),
  );

  const dossiers = await Promise.all(dossierRequests);
  const successDossiers = dossiers
    .filter((dossier) => dossier.success)
    .map((dossier) => dossier.data);

  return (
    <>
      <h1>
        {successDossiers.length > 1 ? "Dossiers acceptés" : "Dossier accepté"}
      </h1>

      {successDossiers.length === 0 ? (
        <div className="py-12 px-8 text-center text-balance text-gray-700 max-w-xl bg-gray-100">
          Aucun dossier n'est associé à l'adresse email{" "}
          <span className="font-semibold">{user.email}</span>
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
