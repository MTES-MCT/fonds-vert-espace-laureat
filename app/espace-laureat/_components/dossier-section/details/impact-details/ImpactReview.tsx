import Link from "next/link";

import { Help } from "@/app/espace-laureat/_components/dossier-section/details/impact-details/Help";
import { DossierState } from "@/generated/graphql";
import { Impact } from "@/services/ds/impact";

export function ImpactReview({ impact }: { impact: Impact }) {
  if (impact.state === DossierState.EnConstruction) {
    return (
      <>
        <Help>
          Votre évaluation sera instruite prochainement. Vous pouvez encore la
          modifier.
        </Help>
        <ImpactReviewLink impact={impact} label="Modifier l'évaluation" />
      </>
    );
  }

  if (impact.state === DossierState.EnInstruction) {
    return (
      <>
        <Help>Votre évaluation est en cours d'instruction.</Help>
        <ImpactReviewLink impact={impact} label="Consulter l'évaluation" />
      </>
    );
  }

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
