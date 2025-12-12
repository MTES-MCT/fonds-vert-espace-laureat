import {
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

import { DOSSIER_NUMBER } from "./constants";

export const fondsVertLoginData = {
  access_token: "abc",
  token_type: "bearer",
};

export const fondsVertDossierData = { data: demoDossierFondsVert };

export const fondsVertFinancesEJ1Data = {
  count: 1,
  next_page: null,
  previous_page: null,
  data: demoFinancesEJ1,
};

export const fondsVertFinancesEJ2Data = {
  count: 1,
  next_page: null,
  previous_page: null,
  data: demoFinancesEJ2,
};

export const fondsVertDossiersListBySiretData = {
  data: [{ socle_commun: { dossier_number: DOSSIER_NUMBER } }],
};

export const INSTRUCTEUR_DOSSIER_NUMBER = 99999999;

export const fondsVertDossiersListByInstructeurData = {
  data: [{ socle_commun: { dossier_number: INSTRUCTEUR_DOSSIER_NUMBER } }],
};
