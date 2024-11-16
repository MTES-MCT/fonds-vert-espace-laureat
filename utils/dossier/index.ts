import { ChampFragmentFragment } from "@/generated/graphql";
import { Champs, getValueByType } from "@/utils/dossier/champs";

export interface Dossier {
  numero: number;
  dateTraitement: Date;
  demandeur: {
    siret: string;
    libelleNaf: string;
  };
  demarche: {
    title: string;
  };
  champs: Champs;
}

export function getChamps(champs: ChampFragmentFragment[]) {
  return champs.reduce(getValueByType, {});
}
