export function AucunDossier({
  siret,
  email,
  noResultMsg,
}: {
  siret: string;
  email: string;
  noResultMsg: string;
}) {
  return (
    <div
      className={`
        mb-6 flex h-96 w-full flex-col items-center justify-center gap-y-6 border border-gray-200
        text-center
      `}
    >
      <span
        className="fr-icon-warning-fill fr-icon--lg text-gray-900"
        aria-hidden="true"
      ></span>
      <h2 className="mb-0 max-w-lg text-lg">
        Aucun dossier n'est associé à l'adresse email {email} et au siret{" "}
        {siret}
      </h2>
      <p className="mb-0 max-w-3xl text-balance text-gray-700">{noResultMsg}</p>
    </div>
  );
}
