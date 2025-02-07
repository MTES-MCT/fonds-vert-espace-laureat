import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { DossierState } from "@/generated/graphql";
import { Impact } from "@/services/ds/impact";

export function ImpactReview({ impact }: { impact: Impact }) {
  return (
    <>
      <Help>Votre évaluation a été instruite.</Help>
      <ImpactReviewLink impact={impact} label="Consulter l'évaluation" />
    </>
  );
}

const ImpactReviewLink = ({
  impact,
  label,
}: {
  impact: Impact;
  label: string;
}) => {
  return (
    <Link
      className="fr-btn fr-btn--tertiary fr-btn--sm bg-white hover:bg-gray-50"
      target="_blank"
      href={`https://www.demarches-simplifiees.fr/dossiers/${impact?.numero}`}
    >
      {label}
    </Link>
  );
};
