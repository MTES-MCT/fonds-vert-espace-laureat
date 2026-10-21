import Link from "next/link";

export default async function ConnexionEchec({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const mfaRequired = (await searchParams).error === "mfa_required";

  return (
    <div className="fr-container my-8">
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
        <Link href="/projets">← Réessayer</Link>
      </p>
    </div>
  );
}
