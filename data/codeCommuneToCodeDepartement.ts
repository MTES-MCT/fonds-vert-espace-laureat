/**
 * Convertit un code commune en code département, au sens de l'INSEE.
 * Le code commune n'est **pas** le code postal.
 */
export function codeCommuneToCodeDepartement(communeCode: string): string {
  // Cas de la Corse
  if (communeCode.startsWith("2A")) {
    return "2A";
  }
  if (communeCode.startsWith("2B")) {
    return "2B";
  }

  // Case des collectivités et départements d'outre-mer
  const threeDigitCodes = [
    "971", // Guadeloupe
    "972", // Martinique
    "973", // Guyane
    "974", // La Réunion
    "975", // Saint-Pierre-et-Miquelon
    "976", // Mayotte
    "977", // Saint-Barthélemy (post 2007)
    "978", // Saint-Martin (post 2007)
    "984", // Terres Australes et Antarctiques Françaises
    "986", // Wallis-et-Futuna
    "987", // Polynésie Française
    "988", // Nouvelle-Calédonie
    "989", // Clipperton
  ];

  const firstThreeChars = communeCode.substring(0, 3);
  if (threeDigitCodes.includes(firstThreeChars)) {
    return firstThreeChars;
  }

  // Cas général : Les deux premiers caractères sont le code département
  return communeCode.substring(0, 2);
}
