import { ChampFragmentFragment } from "@/generated/graphql";
import { getValueByTypeBuilder } from "@/services/ds/helpers/getValueByTypeBuilder";

import { mapping, STATUT_REALISATION_CHAMP_ID } from "./mapping";

export interface Champs {
  numeroDossierSubvention?: number;
  statutRealisationProjet?: string;
  updatedAt?: string;
}

const champsDefault: Champs = {};

export function getChamps(champs: ChampFragmentFragment[]) {
  const result = champs.reduce<Champs>(
    getValueByTypeBuilder(mapping),
    champsDefault,
  );

  const statutChamp = champs.find(
    (champ) => champ.champDescriptorId === STATUT_REALISATION_CHAMP_ID,
  );

  if (statutChamp?.stringValue) {
    result.statutRealisationProjet = statutChamp.stringValue;
    result.updatedAt = statutChamp.updatedAt;
  }

  return result;
}
