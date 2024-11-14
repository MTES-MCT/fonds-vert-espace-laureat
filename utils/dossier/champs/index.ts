import { ChampFragmentFragment } from "@/generated/graphql";
import { mapping } from "@/utils/dossier/champs/mapping";

export interface Champs {
  intituleProjet?: string;
  montantSubventionAttribuee?: number;
  numeroEngagementJuridique?: string;
}

const add = (
  acc: Champs,
  champ: ChampFragmentFragment,
  value?: string | number | null,
) => {
  return {
    ...acc,
    [mapping[champ.champDescriptorId]]: value,
  };
};

export function getValueByType(champs: Champs, champ: ChampFragmentFragment) {
  switch (champ.__typename) {
    case "DecimalNumberChamp":
      return add(champs, champ, champ.decimalNumber);
    case "TextChamp":
      return add(champs, champ, champ.stringValue);
    case "EngagementJuridiqueChamp":
      return add(champs, champ, champ.stringValue);
    default:
      return champs;
  }
}
