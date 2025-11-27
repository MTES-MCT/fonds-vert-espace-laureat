import {
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

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
