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
