import Link from "next/link";

export default function ConnexionEchec() {
  return (
    <>
      <h1>L'identification a échoué</h1>
      <p className="fr-text--lead">
        Veuillez nous contacter si le problème se reproduit.
      </p>
      <p>
        <Link href="/espace-laureat">← Réessayer</Link>
      </p>
    </>
  );
}
