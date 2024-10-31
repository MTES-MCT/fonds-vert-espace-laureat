import Link from "next/link";

export default function ConnexionRefuse() {
  return (
    <>
      <h1 className="max-w-2xl">
        Vous n’êtes pas autorisé(e) à accéder à l'espace lauréat
      </h1>
      <p className="fr-text--lead">
        Veuillez nous contacter si vous pensez qu'il s'agit d'une erreur.
      </p>
      <p>
        <Link href="/">← Retourner à la page d'accueil</Link>
      </p>
    </>
  );
}
