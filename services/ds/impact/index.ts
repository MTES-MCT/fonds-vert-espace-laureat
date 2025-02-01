import { DossierState } from "@/generated/graphql";
import { Champs } from "@/services/ds/impact/champs";

export interface Impact {
  numero: number;
  state: DossierState;
  dateTraitement: Date;
  demandeur: {
    email: string;
  };
  champs: Champs;
}
