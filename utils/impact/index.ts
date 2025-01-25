import { Champs } from "@/utils/impact/champs";

export interface Impact {
  numero: number;
  state: string;
  dateTraitement: Date;
  demandeur: {
    email: string;
  };
  champs: Champs;
}
