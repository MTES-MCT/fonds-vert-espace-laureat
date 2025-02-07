import { compareDesc } from "date-fns";

import { Dossier } from "@/services/ds/subvention";

export function compareDateSignatureDecision(a: Dossier, b: Dossier) {
  const dateA = a.champs.dateSignatureDecision
    ? new Date(a.champs.dateSignatureDecision)
    : null;

  const dateB = b.champs.dateSignatureDecision
    ? new Date(b.champs.dateSignatureDecision)
    : null;

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return compareDesc(dateA, dateB);
}
