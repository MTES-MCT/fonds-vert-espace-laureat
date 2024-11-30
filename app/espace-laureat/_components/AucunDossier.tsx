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
    <div className="flex flex-col gap-y-6 text-center items-center justify-center border w-full h-96">
      <span
        className="text-gray-900 fr-icon-warning-fill fr-icon--lg"
        aria-hidden="true"
      ></span>
      <h2 className="text-lg max-w-lg mb-0">
        Aucun dossier n'est associé à l'adresse email {email} et au siret{" "}
        {siret}
      </h2>
      <p className="max-w-3xl mb-0 text-gray-700  text-balance">
        {noResultMsg}
      </p>
    </div>
  );
}
