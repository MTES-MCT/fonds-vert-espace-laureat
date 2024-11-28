import { Dossier } from "@/utils/dossier";

const demandeur = {
  demandeur: {
    email: "alice.doe@example.com",
    siret: "12345678910111",
    libelleNaf: "Mon entreprise",
  },
};

const resumeProjet =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export const demoDossier1: Dossier = {
  numero: 12345678,
  dateTraitement: new Date(),
  ...demandeur,
  demarche: {
    title: "FONDS VERT - Rénovation énergétique des bâtiments publics locaux",
  },
  champs: {
    intituleProjet: "Projet 1 de démonstration",
    resumeProjet,
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

export const demoDossier2: Dossier = {
  numero: 12345910,
  dateTraitement: new Date(),
  ...demandeur,
  demarche: {
    title: "FONDS VERT - Renaturation des villes et des villages",
  },
  champs: {
    intituleProjet: "Projet 2 de démonstration",
    resumeProjet,
    departementImplantation: "Nantes",
    montantSubventionAttribuee: 4000000,
    emailRepresentantLegal: "alice.doe@example.com",
    emailResponsableSuivi: "bob.doe@example.com",
    dateSignatureDecision: new Date(),
    numeroEngagementJuridique: "987654",
    autresNumerosEngagementJuridique: ["123456", "654321"],
  },
};
