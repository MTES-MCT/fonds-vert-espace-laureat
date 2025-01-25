import { Champs } from "@/utils/demarches/impact/champs";

export interface Impact {
  numero: number;
  state: string;
  dateTraitement: Date;
  demandeur: {
    email: string;
  };
  champs: Champs;
}
