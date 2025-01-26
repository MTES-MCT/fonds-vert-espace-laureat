import { ChampFragmentFragment } from "@/generated/graphql";
import { getValueByTypeBuilder } from "@/utils/demarches/helpers/getValueByTypeBuilder";

import { mapping } from "./mapping";

export interface Champs {
  numeroDossierSubvention?: number;
}

const champsDefault: Champs = {};

export function getChamps(champs: ChampFragmentFragment[]) {
  return champs.reduce<Champs>(getValueByTypeBuilder(mapping), champsDefault);
}
