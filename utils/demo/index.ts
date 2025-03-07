import { Dossier } from "@/services/ds/subvention";
import { DossierFondsVert } from "@/services/fondsvert/dossier";

const demandeur = {
  demandeur: {
    email: "alice.doe@example.com",
    siret: "12345678910111",
    libelleNaf: "Mon entreprise",
  },
};

const resumeProjet =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

export const demoDossier1: Dossier = {
  numero: 12345678,
  dateTraitement: new Date(),
  ...demandeur,
  demarche: {
    title: "FONDS VERT - Rénovation énergétique des bâtiments publics locaux",
  },
  champs: {
    intituleProjet: "Rénovation de la piscine Jacques Demy",
    resumeProjet,
    departementImplantation: "Nantes",
    montantSubventionAttribuee: 10073574,
    emailRepresentantLegal: "alice.doe@example.com",
    emailResponsableSuivi: "bob.doe@example.com",
    dateSignatureDecision: new Date(),
    numeroEngagementJuridique: "987654",
    autresNumerosEngagementJuridique: ["123456", "654321"],
  },
};

export const demoDossierFondsVert: DossierFondsVert = {
  demarche_specifique: {
    surface_batiment_m2_avant_projet: 4968,
    surface_batiment_m2_apres_projet: null,
    type_surface: "surface de plancher",
    modifie_surface_batiment: null,
    systeme_chauffage_avant_travaux: "Chauffage urbain et électrique",
    systeme_chauffage_apres_travaux: "Chauffage urbain et électrique",
    conso_energetique_avant_travaux: 2055650,
    conso_energetique_apres_travaux: 1235863,
    emission_ges_avant_travaux: 448,
    emission_ges_apres_travaux: 312,
    gain_energetique_estime_percentage: 39,
    emission_ges_evitees_percentage: 38,
  },
  information_financiere: {
    centre_financier_chorus: "0789-IDF1-DR75",
    informations_engagement: [
      {
        annee_information_financiere: 2023,
        engagements_juridiques: [
          {
            numero_ej: "2105212345",
            nom_demarche: "Rénovation énergétique des bâtiments publics locaux",
            nom_axe: 1,
            montant_engage: 10073574,
            montant_engage_initial: 10073574,
            demandes_paiement: [],
          },
        ],
      },
      {
        annee_information_financiere: 2024,
        engagements_juridiques: [
          {
            numero_ej: "2105212345",
            nom_demarche: "Rénovation énergétique des bâtiments publics locaux",
            nom_axe: 1,
            montant_engage: 10073574,
            montant_engage_initial: 10073574,
            demandes_paiement: [
              {
                numero_dp: "1001234567",
                date_dp: "2024-10-07T00:00:00",
                montant_paye: 3422079.2,
              },
            ],
          },
        ],
      },
      {
        annee_information_financiere: 2025,
        engagements_juridiques: [
          {
            numero_ej: "2105212345",
            nom_demarche: "Rénovation énergétique des bâtiments publics locaux",
            nom_axe: 1,
            montant_engage: 6651494.8,
            montant_engage_initial: 10073574,
            demandes_paiement: [],
          },
        ],
      },
    ],
  },
};
