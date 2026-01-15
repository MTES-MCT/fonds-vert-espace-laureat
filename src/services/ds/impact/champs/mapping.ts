import { descriptorIdsToMapping } from "@/services/ds/helpers/descriptorIdsToMapping";

export const STATUT_REALISATION_CHAMP_ID = "Q2hhbXAtNTQ1OTM1Nw==";

const descriptorIds = {
  numeroDossierSubvention: ["Q2hhbXAtNDc2OTEyOQ=="],
  statutRealisationProjet: [STATUT_REALISATION_CHAMP_ID],
};

export const mapping = descriptorIdsToMapping(descriptorIds);
