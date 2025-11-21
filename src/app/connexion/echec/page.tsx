import Link from "next/link";

export default function ConnexionEchec() {
  return (
    <div className="fr-container my-8">
      <h1>L'identification a échoué</h1>
      <p className="fr-text--lead">
        Veuillez nous contacter si le problème se reproduit.
      </p>
      <p>
        <Link href="/espace-laureat">← Réessayer</Link>
      </p>
    </div>
  );
}
