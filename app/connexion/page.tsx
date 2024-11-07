import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";

export default function Connexion() {
  return (
    <div className="max-w-xl pb-24">
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
