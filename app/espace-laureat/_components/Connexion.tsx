import Alert from "@codegouvfr/react-dsfr/Alert";
import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";

export function Connexion({ error }: { error?: string }) {
  return (
    <div className="max-w-xl pb-48">
      {error && (
        <Alert className="mb-6" severity="warning" small description={error} />
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
