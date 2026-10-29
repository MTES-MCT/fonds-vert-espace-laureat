import Link from "next/link";

import { StartDsfrOnHydration } from "@/components/dsfr";
import { getSession } from "@/utils/session";
import { getAuthenticatedReturnUrl } from "@/utils/url";

export default async function ConnexionEchec({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const mfaRequired = (await searchParams).error === "mfa_required";
  const session = await getSession();
  const destination = getAuthenticatedReturnUrl(session?.returnTo);
  const returnTo = destination.pathname + destination.search + destination.hash;

  return (
    <div className="fr-container my-8">
      <StartDsfrOnHydration />
      <h1>
        {mfaRequired
          ? "Double authentification requise"
          : "L'identification a échoué"}
      </h1>
      <p className="fr-text--lead">
        {mfaRequired
          ? "La connexion ProConnect n’a pas confirmé de second facteur. Réessayez en suivant les étapes proposées par ProConnect."
          : "Veuillez nous contacter si le problème se reproduit."}
      </p>
      <p>
        <Link href={`/connexion?returnTo=${encodeURIComponent(returnTo)}`}>
          ← Réessayer
        </Link>
      </p>
    </div>
  );
}
