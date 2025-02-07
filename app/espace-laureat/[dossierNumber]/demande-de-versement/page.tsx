import Link from "next/link";

export default async function Versement({
  params,
}: {
  params: Promise<{ dossierNumber: string }>;
}) {
  const { dossierNumber } = await params;

  return (
    <div className="max-w-xl pb-8">
      <h1>Demande de versement</h1>
      <h2>Dossier n°{dossierNumber}</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
      <div className="flex justify-between">
        <Link
          className="fr-btn fr-btn--tertiary"
          href={`/espace-laureat${dossierNumber.startsWith("12345") ? "/demo" : ""}#dossier-${dossierNumber}`}
        >
          Retour
        </Link>
        <Link className="fr-btn" href="mailto:contact@example.com">
          Contacter le service
        </Link>
      </div>
    </div>
  );
}
