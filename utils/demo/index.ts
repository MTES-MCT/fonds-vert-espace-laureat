import { Dossier } from "@/utils/dossier";

const demandeur = {
  demandeur: {
    email: "alice.doe@example.com",
    siret: "12345678910111",
    libelleNaf: "FONDS VERT - Renaturation des villes et des villages",
  },
};

const demarche = {
  demarche: {
    title: "Dossier de demande de subvention",
  },
};

export const demoDossier1 = {
  numero: 12345678,
  dateTraitement: new Date(),
  ...demandeur,
  ...demarche,
  champs: {
    intituleProjet: "Projet 1 de démonstration",
    resumeProjet: "Lorem ipsum dolor sit amet",
    departementImplantation: "Paris",
    montantSubventionAttribuee: 100000,
    emailRepresentantLegal: "alice.doe@example.com",
    emailResponsableSuivi: "bob.doe@example.com",
    dateSignatureDecision: new Date(),
    numeroDossierAgenceEau: "45678",
    numeroEngagementJuridique: "987654",
    autresNumerosEngagementJuridique: ["123456", "654321"],
  },
};

export const demoDossier2 = {
  numero: 12345910,
  dateTraitement: new Date(),
  ...demandeur,
  ...demarche,
  champs: {
    intituleProjet: "Projet 2 de démonstration",
    resumeProjet: "Lorem ipsum dolor sit amet",
    departementImplantation: "Nantes",
    montantSubventionAttribuee: 4000000,
    emailRepresentantLegal: "alice.doe@example.com",
    emailResponsableSuivi: "bob.doe@example.com",
    dateSignatureDecision: new Date(),
    numeroEngagementJuridique: "987654",
    autresNumerosEngagementJuridique: ["123456", "654321"],
  },
};
