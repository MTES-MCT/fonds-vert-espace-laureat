import { Champs } from "@/utils/dossier/champs";

export interface Dossier {
  numero: number;
  dateTraitement: Date;
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
