import { descriptorIdsToMapping } from "@/services/ds/helpers/descriptorIdsToMapping";

type DemarcheChamps = {
  intituleProjet: string;
  resumeProjet: string;
  departementImplantation: string;
  emailRepresentantLegal: string;
  emailResponsableSuivi: string;
  montantSubventionAttribuee: string;
  numeroDossierAgenceEau?: string;
  numeroEngagementJuridique: string;
  autresNumerosEngagementJuridique: string;
  dateSignatureDecision: string;
};

// Rénovation énergétique des bâtiments publics locaux (DS 69071)
const renovationEnergetique: DemarcheChamps = {
  intituleProjet: "Q2hhbXAtMjk3MTQ0NA==",
  resumeProjet: "Q2hhbXAtMjk5Nzg3Mw==",
  departementImplantation: "Q2hhbXAtMzM0ODkyMw==",
  emailRepresentantLegal: "Q2hhbXAtMzgwNTc1Mw==",
  emailResponsableSuivi: "Q2hhbXAtMjkzNDQwMA==",
  montantSubventionAttribuee: "Q2hhbXAtMTk5MDI2Ng==",
  numeroDossierAgenceEau: "Q2hhbXAtMzAyNTQ3NQ==",
  numeroEngagementJuridique: "Q2hhbXAtMjk4MjUwMQ==",
  autresNumerosEngagementJuridique: "Q2hhbXAtNDA4MzY4NA==",
  dateSignatureDecision: "Q2hhbXAtMjk4MjQ5NA==",
};

// Renaturation des villes et des villages (DS 67821)
const renaturation: DemarcheChamps = {
  intituleProjet: "Q2hhbXAtMjk3ODA3NQ==",
  resumeProjet: "Q2hhbXAtMjY2NDgxNg==",
  departementImplantation: "Q2hhbXAtMzM0ODgzMg==",
  emailRepresentantLegal: "Q2hhbXAtMzgwMzkxMA==",
  emailResponsableSuivi: "Q2hhbXAtMjkzNDQwMA==",
  montantSubventionAttribuee: "Q2hhbXAtMjk4NjgwNA==",
  numeroEngagementJuridique: "Q2hhbXAtMjk4NjgxMQ==",
  autresNumerosEngagementJuridique: "Q2hhbXAtNDA4MzgwNw==",
  dateSignatureDecision: "Q2hhbXAtMjk4NjgwMg==",
};

// Recyclage foncier (DS 68862)
const recyclageFoncier: DemarcheChamps = {
  intituleProjet: "Q2hhbXAtMjk4Nzg0Ng==",
  resumeProjet: "Q2hhbXAtMjk4Nzg1MA==",
  departementImplantation: "Q2hhbXAtMzM0OTA4Nw==",
  emailRepresentantLegal: "Q2hhbXAtMzc5NjMzNg==",
  emailResponsableSuivi: "Q2hhbXAtMjk4Nzc5Mg==",
  montantSubventionAttribuee: "Q2hhbXAtMzAyNTA1Ng==",
  numeroEngagementJuridique: "Q2hhbXAtNDA2MTgxMQ==",
  autresNumerosEngagementJuridique: "Q2hhbXAtNDA2MTgxMA==",
  dateSignatureDecision: "Q2hhbXAtMzAyNTA1NQ==",
};

const demarches = [renovationEnergetique, renaturation, recyclageFoncier];

function demarchesToDescriptorIds(
  demarches: DemarcheChamps[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const demarche of demarches) {
    for (const [field, champId] of Object.entries(demarche)) {
      if (!result[field]) result[field] = [];
      result[field].push(champId);
    }
  }
  return result;
}

export const mapping = descriptorIdsToMapping(
  demarchesToDescriptorIds(demarches),
);
