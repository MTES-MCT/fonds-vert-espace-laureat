export interface Projet {
  demarche_title: string;
  demarche_number: number;
  nom_du_projet: string;
  resume_du_projet: string | null;
  date_depot: string;
  code_region: string;
  nom_region: string;
  code_departement: string;
  nom_departement: string;
  nom_commune_sinon_departement: string;
  code_commune_sinon_departement: string;
  code_commune: string;
  nom_commune: string;
  entreprise_raison_sociale: string;
  total_des_depenses: number;
  annee_millesime: number;
  montant_subvention_attribuee: number | null;
  zonages_specifiques: string | null;
  entreprise_forme_juridique: string;
  population_commune: number;
}
