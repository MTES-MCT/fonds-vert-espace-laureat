const descriptorIds = {
  intituleProjet: ["Q2hhbXAtMjk3MTQ0NA==", "Q2hhbXAtMjk3ODA3NQ=="],
  resumeProjet: ["Q2hhbXAtMjk5Nzg3Mw==", "Q2hhbXAtMjY2NDgxNg=="],
  departementImplantation: ["Q2hhbXAtMzM0ODkyMw==", "Q2hhbXAtMzM0ODgzMg=="],
  emailRepresentantLegal: ["Q2hhbXAtMzgwNTc1Mw==", "Q2hhbXAtMzgwMzkxMA=="],
  emailResponsableSuivi: ["Q2hhbXAtMjkzNDQwMA==", "Q2hhbXAtMjkzNDQwMA=="],
  montantSubventionAttribuee: ["Q2hhbXAtMTk5MDI2Ng==", "Q2hhbXAtMjk4NjgwNA=="],
  numeroEngagementJuridique: ["Q2hhbXAtMjk4MjUwMQ==", "Q2hhbXAtMjk4NjgxMQ=="],
  autresNumerosEngagementJuridique: [
    "Q2hhbXAtNDA4MzY4NA==",
    "Q2hhbXAtNDA4MzgwNw==",
  ],
  dateSignatureDecision: ["Q2hhbXAtMjk4MjQ5NA==", "Q2hhbXAtMjk4NjgwMg=="],
};

export const mapping: { [key: string]: string } = Object.fromEntries(
  Object.entries(descriptorIds).flatMap(([key, values]) =>
    values.map((value) => [value, key]),
  ),
);
