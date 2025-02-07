import Link from "next/link";
import { ReactNode } from "react";

import { DossierState } from "@/generated/graphql";
import { Impact } from "@/services/ds/impact";

export const ImpactDetails = ({ impact }: { impact?: Impact }) => {
  if (!impact?.numero) {
    return (
      <>
        <Help>
          Les données de votre projet participent à la transition écologique.
          Merci de compléter l'évaluation d'impact réel de votre projet,
          conformément aux engagements liés à la subvention.
        </Help>
        <Link
          className="fr-btn fr-btn--tertiary fr-btn--sm bg-white hover:bg-gray-50"
          target="_blank"
          href="https://www.demarches-simplifiees.fr/commencer/b709e4b9-57a5-46be-b570-59d6be6c1643"
        >
          Compléter l'évaluation
        </Link>
      </>
    );
  }

  if (impact.state === DossierState.EnConstruction) {
    return (
      <>
        <Help>
          Votre évaluation sera instruite prochainement. Vous pouvez encore la
          modifier.
        </Help>
        <ConsulterDossierImpact impact={impact} label="Modifier l'évaluation" />
      </>
    );
  }

  if (impact.state === DossierState.EnInstruction) {
    return (
      <>
        <Help>Votre évaluation est en cours d'instruction.</Help>
        <ConsulterDossierImpact
          impact={impact}
          label="Consulter l'évaluation"
        />
      </>
    );
  }

  return (
    <>
      <Help>Votre évaluation a été instruite.</Help>
      <ConsulterDossierImpact impact={impact} label="Consulter l'évaluation" />
    </>
  );
};

const ConsulterDossierImpact = ({
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

const Help = ({ children }: { children: ReactNode }) => {
  return <p className="text-sm mb-3 text-balance">{children}</p>;
};
