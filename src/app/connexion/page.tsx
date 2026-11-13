import Alert from "@codegouvfr/react-dsfr/Alert";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";

import { StartDsfrOnHydration } from "@/components/dsfr";
import { isRealServiceConfigured } from "@/utils/env";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  const serviceConfigured = isRealServiceConfigured();

  const errorMessages: Record<string, string> = {
    user_unknown: "Veuillez vous connecter pour accéder à cette page.",
  };

  const errorMessage = error && errorMessages[error];

  return (
    <div className="fr-container my-8 pb-48">
      <StartDsfrOnHydration />
      <div className="max-w-xl">
        {serviceConfigured && errorMessage && (
          <Alert
            className="mb-6"
            severity="warning"
            small
            description={errorMessage}
          />
        )}
        <h1>Vert impact</h1>
        {serviceConfigured ? (
          <>
            <p className="fr-text--lead">
              Ce service est accessible aux porteurs et aux instructeurs d'un
              projet Fonds vert. Identifiez-vous pour suivre les subventions et
              l'impact des projets.
            </p>
            <ProConnectButton
              url={`/api/auth/proconnect/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
            />
          </>
        ) : (
          <Alert
            severity="error"
            small
            description="Le service est actuellement fermé."
          />
        )}
      </div>
    </div>
  );
}
