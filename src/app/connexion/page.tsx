import Alert from "@codegouvfr/react-dsfr/Alert";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    email_not_verified: `Votre adresse n'a pas été vérifiée par ProConnect.`,
    user_unknown: "Veuillez vous connecter pour accéder à cette page.",
  };

  const errorMessage = error && errorMessages[error];

  return (
    <div className="max-w-xl pb-48">
      {errorMessage && (
        <Alert
          className="mb-6"
          severity="warning"
          small
          description={errorMessage}
        />
      )}
      <h1>Espace lauréat</h1>
      <p className="fr-text--lead">
        Ce service est accessible aux porteurs d'un projet lauréat du Fonds
        vert. Identifiez-vous pour suivre vos subventions et soumettre une
        demande de versement.
      </p>
      <ProConnectButton url="/api/auth/proconnect/login" />
    </div>
  );
}
