import { Champs } from "@/services/ds/subvention/champs";
import type { ProjectView } from "@/utils/projectView";

export interface Dossier {
  viewerRelationship?: ProjectView;
  numero: number;
  demandeur: {
    siret: string;
  };
  demarche: {
    title: string;
  };
  champs: Champs;
}
