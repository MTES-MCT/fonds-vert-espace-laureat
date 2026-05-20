import { Champs } from "@/services/ds/subvention/champs";

export interface Dossier {
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
