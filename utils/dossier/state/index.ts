import { DossierState } from "@/generated/graphql";

export function stateToLongLabel(state: DossierState) {
  switch (state) {
    case DossierState.EnConstruction:
      return "Votre dossier est toujours en construction. Veuillez le soumettre.";
    case DossierState.EnInstruction:
      return "Votre dossier est en cours d'instruction.";
    case DossierState.SansSuite:
      return "Votre dossier a été classé sans suite.";
    case DossierState.Refuse:
      return "Votre dossier a été refusé.";
    case DossierState.Accepte:
      return "Votre dossier a été accepté.";
  }
}
