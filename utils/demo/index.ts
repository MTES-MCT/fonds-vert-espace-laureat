export const getDemoDossierNumber = () => {
  const demoDossierNumber = Number(process.env.DEMO_DOSSIER_NUMBER);

  if (!demoDossierNumber) {
    throw new Error(
      "La variable d'environnement DEMO_DOSSIER_NUMBER n'est pas définie ou n'est pas un nombre",
    );
  }

  return demoDossierNumber;
};
