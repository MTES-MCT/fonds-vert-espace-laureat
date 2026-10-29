import { Champs } from "@/services/ds/subvention/champs";
import type { ProjectView } from "@/utils/projectView";

export interface Dossier {
  viewerRelationship?: ProjectView;
  numero: number;
  dateTraitement: Date | null;
  demandeur: {
    email: string;
    siret: string;
    libelleNaf: string;
  };
  demarche: {
    title: string;
  };
  champs: Champs;
}
