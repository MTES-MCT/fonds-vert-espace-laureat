import { ChampFragmentFragment } from "@/generated/graphql";
import { getValueByTypeBuilder } from "@/services/ds/helpers/getValueByTypeBuilder";

import { mapping } from "./mapping";

export interface Champs {
  numeroDossierSubvention?: number;
}

const champsDefault: Champs = {};

export function getChamps(champs: ChampFragmentFragment[]) {
  return champs.reduce<Champs>(getValueByTypeBuilder(mapping), champsDefault);
}
