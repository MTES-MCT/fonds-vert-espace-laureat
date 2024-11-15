import {
  ChampFragmentFragment,
  RootChampFragmentFragment,
} from "@/generated/graphql";
import { mapping } from "@/utils/dossier/champs/mapping";

export interface Champs {
  intituleProjet?: string;
  resumeProjet?: string;
  dateSignatureDecision?: Date;
  departementImplantation?: string;
  emailRepresentantLegal?: string;
  emailResponsableSuivi?: string;
  montantSubventionAttribuee?: number;
  numeroDossierAgenceEau?: string;
  numeroEngagementJuridique?: string;
  autresNumerosEngagementJuridique?: string[];
}

const add = (
  acc: Champs,
  champ: { champDescriptorId: string },
  value?: string[] | string | number | null,
) => {
  return {
    ...acc,
    [mapping[champ.champDescriptorId]]: value,
  };
};

function isChampFragmentFragment(
  champ: ChampFragmentFragment | RootChampFragmentFragment,
): champ is ChampFragmentFragment {
  return champ.__typename !== "RepetitionChamp";
}

export function getValueByType(
  champs: Champs,
  champ: ChampFragmentFragment | RootChampFragmentFragment,
) {
  if (isChampFragmentFragment(champ)) {
    switch (champ.__typename) {
      case "DecimalNumberChamp":
        return add(champs, champ, champ.decimalNumber);
      case "TextChamp":
        return add(champs, champ, champ.stringValue);
      case "DateChamp":
        return add(champs, champ, champ.date);
      case "EngagementJuridiqueChamp":
        return add(champs, champ, champ.stringValue);
      default:
        return champs;
    }
  } else {
    switch (champ.__typename) {
      case "RepetitionChamp":
        return add(
          champs,
          champ,
          champ.rows
            .flatMap((row) => row.champs.map((champ) => champ.stringValue))
            .filter((v) => v !== null && v !== undefined),
        );
      default:
        return champs;
    }
  }
}
