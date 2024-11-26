import Badge from "@codegouvfr/react-dsfr/Badge";

export function NumerosEngagementJuridique({
  numeroEngagementJuridique,
  autresNumerosEngagementJuridique,
}: {
  numeroEngagementJuridique?: string;
  autresNumerosEngagementJuridique: string[];
}) {
  return (
    <>
      <dt>
        {numeroEngagementJuridique &&
        autresNumerosEngagementJuridique.length > 0
          ? "Numéros"
          : "Numéro"}{" "}
        d'engagement juridique
      </dt>
      <dd>
        <ul className="flex gap-x-2 list-none">
          {numeroEngagementJuridique && (
            <li>
              <Badge>{numeroEngagementJuridique}</Badge>
            </li>
          )}
          {autresNumerosEngagementJuridique.map((num, index) => (
            <li key={index}>
              <Badge>{num}</Badge>
            </li>
          ))}
        </ul>
      </dd>
    </>
  );
}
