import Link from "next/link";

export default function DemoDossierNotFound() {
  return (
    <div className="fr-container py-8">
      <h1>Projet de démonstration introuvable</h1>
      <Link className="fr-link" href="/projets/demo">
        Revenir aux projets de démonstration
      </Link>
    </div>
  );
}
