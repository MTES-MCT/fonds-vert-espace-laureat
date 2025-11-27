import { fetchFondsVert } from "../helpers";

export interface PosteEJ {
  numero_poste_ej: number;
  numero_dossier_ds: number;
  centre_financier: string;
  centre_couts: string;
  referentiel_programmation: string;
  referentiel_programmation_label: string;
  fournisseur_titulaire_nom: string;
  fournisseur_titulaire_numero: string;
  fournisseur_titulaire_siren: string;
  montant_engage: number;
}

export interface AnneeInformationFinanciereEJ {
  annee_information_financiere: number;
  montant_engage_total: number;
  postes: PosteEJ[];
}

export interface FinancesEJData {
  numero_ej: string;
  date_creation_ej: string;
  montant_engage_initial: number;
  annees_informations_financieres: AnneeInformationFinanciereEJ[];
}

interface FinancesEJApiResponse {
  count: number;
  next_page: string | null;
  previous_page: string | null;
  data: FinancesEJData;
}

export async function getFinancesEJ({ numeroEJ }: { numeroEJ: string }) {
  return fetchFondsVert<FinancesEJApiResponse>(`v2/finances/${numeroEJ}`);
}
