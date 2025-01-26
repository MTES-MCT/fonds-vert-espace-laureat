import { ChampFragmentFragment } from "@/generated/graphql";
import { getValueByTypeBuilder } from "@/utils/demarches/helpers/getValueByTypeBuilder";
import { mapping } from "@/utils/demarches/subvention/champs/mapping";

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
  autresNumerosEngagementJuridique: string[];
}

const champsDefault: Champs = {
  autresNumerosEngagementJuridique: [],
};

export function getChamps(champs: ChampFragmentFragment[]) {
  return champs.reduce<Champs>(getValueByTypeBuilder(mapping), champsDefault);
}
