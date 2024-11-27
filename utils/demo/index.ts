import { Dossier } from "@/utils/dossier";

export const getDemoDossierNumbers = () => {
  const demoDossierNumbers = process.env.DEMO_DOSSIER_NUMBERS;

  if (!demoDossierNumbers) {
    throw new Error(
      "La variable d'environnement DEMO_DOSSIER_NUMBERS n'est pas définie",
    );
  }

  return demoDossierNumbers.split(",").map(Number);
};

export const demoStaticDossierNumber = 12345678;

export const getDemoStaticDossierResponse = ():
  | { success: true; data: Dossier }
  | { success: false; error: string } => {
  return {
    success: true,
    data: {
      numero: demoStaticDossierNumber,
      dateTraitement: new Date(),
      demandeur: {
        email: "alice.doe@example.com",
        siret: "12345678910111",
        libelleNaf: "FONDS VERT - Renaturation des villes et des villages",
      },
      demarche: {
        title: "Dossier de demande de subvention",
      },
      champs: {
        intituleProjet: "Projet de démonstration",
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
    },
  };
};
