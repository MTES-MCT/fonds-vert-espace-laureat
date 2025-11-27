import { Dossier } from "@/services/ds/subvention";
import { DossierFondsVert } from "@/services/fondsvert/dossier";
import { FinancesEJData } from "@/services/fondsvert/finances";

import {
  AGENCE_EAU_NUMBER,
  CENTRE_COUTS,
  CENTRE_COUTS_2A,
  CENTRE_COUTS_2B,
  CENTRE_COUTS_2C,
  CENTRE_COUTS_2D,
  CENTRE_FINANCIER,
  CENTRE_FINANCIER_2A,
  CENTRE_FINANCIER_2B,
  CENTRE_FINANCIER_2C,
  CENTRE_FINANCIER_2D,
  COMMUNE,
  COMPANY_NAME,
  DEPARTMENT,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
  SIRET,
} from "../../../tests/fixtures/constants";

const demandeur = {
  demandeur: {
    email: LEGAL_REPRESENTATIVE_EMAIL,
    siret: "12345678910111",
    libelleNaf: "Mon entreprise",
  },
};

export const demoDossier1: Dossier = {
  numero: 12345678,
  dateTraitement: new Date(),
  ...demandeur,
  demarche: {
    title: `FONDS VERT - ${PROGRAM_TITLE}`,
  },
  champs: {
    intituleProjet: PROJECT_TITLE,
    resumeProjet: PROJECT_SUMMARY,
    departementImplantation: DEPARTMENT,
    montantSubventionAttribuee: 10073574,
    emailRepresentantLegal: LEGAL_REPRESENTATIVE_EMAIL,
    emailResponsableSuivi: "bob.doe@example.com",
    dateSignatureDecision: new Date(),
    numeroEngagementJuridique: "987654",
    autresNumerosEngagementJuridique: ["123456", "654321"],
    numeroDossierAgenceEau: AGENCE_EAU_NUMBER,
  },
};

export const demoDossierFondsVert: DossierFondsVert = {
  socle_commun: {
    demarche_title: PROGRAM_TITLE,
    // Mix of ISO with time and date-only to mirror real API variability
    date_depot: "2023-06-15",
    date_notification: "2023-09-20T08:45:00",
    date_derniere_modification: "2024-03-10T14:12:00",
    date_debut_execution: "2024-01-15",
    date_fin_execution: "2099-12-31T23:59:59",
    total_des_depenses: 18_939_933,
    annee_millesime: 2023,
    entreprise_raison_sociale: "COMMUNE DE NANTES",
    siret: "12345678910111",
    nom_commune: COMMUNE,
  },
  metrique_specifique: {
    surface_batiment_m2_avant_projet: {
      label: "Surface du bâtiment avant projet",
      unite: "m²",
      valeur_estimee: 4968,
      valeur_suivi: null,
    },
    surface_batiment_m2_apres_projet: {
      label:
        "Surface du batiment après le projet. Donnée non disponible en 2024",
      unite: "m²",
      valeur_estimee: null,
      valeur_suivi: null,
    },
    type_surface: {
      label: "Type de surface",
      unite: null,
      valeur_estimee: "Surface habitable",
      valeur_suivi: null,
    },
    modifie_surface_batiment: {
      label:
        "Le projet modifie-t-il la surfaces des bâtiments concernés? Donnée non disponible en 2024",
      unite: null,
      valeur_estimee: null,
      valeur_suivi: null,
    },
    systeme_chauffage_avant_travaux: {
      label: "Système de chauffage avant travaux",
      unite: null,
      valeur_estimee:
        "Chauffage électrique à effet Joule (radiateurs électriques)",
      valeur_suivi: null,
    },
    systeme_chauffage_apres_travaux: {
      label: "Système de chauffage après travaux",
      unite: null,
      valeur_estimee: null,
      valeur_suivi: null,
    },
    nombre_habitant_collecte_separee: {
      label: "Nombre d'habitants concernés par la collecte séparée",
      unite: null,
      valeur_estimee: 66469.0,
      valeur_suivi: null,
    },
    nombre_habitant_gestion_proximite: {
      label: "Nombre d'habitants pratiquant la gestion de proximité",
      unite: null,
      valeur_estimee: 13450.0,
      valeur_suivi: null,
    },
    tonnage_annuel_entrant_gestion_proximite: {
      label: "Tonnage annuel entrant pour la gestion de proximité",
      unite: "t",
      valeur_estimee: 172.0,
      valeur_suivi: null,
    },
    quantite_globale_annuel_biodechets_collectes: {
      label: "Quantité annuelle globale de biodéchets collectés",
      unite: "t",
      valeur_estimee: 308.0,
      valeur_suivi: null,
    },
    conso_energetique_avant_travaux: {
      label: "Consommation énergétique avant travaux",
      unite: "kWh",
      valeur_estimee: 2055650,
      valeur_suivi: null,
    },
    conso_energetique_apres_travaux: {
      label: "Consommation énergétique après travaux",
      unite: "kWh",
      valeur_estimee: 1235863,
      valeur_suivi: 1935960,
    },
    emission_ges_avant_travaux: {
      label: "Émissions de GES avant travaux",
      unite: "kgCO₂e",
      valeur_estimee: 448,
      valeur_suivi: null,
    },
    emission_ges_apres_travaux: {
      label: "Émissions de GES après travaux",
      unite: "kgCO₂e",
      valeur_estimee: 312,
      valeur_suivi: 383,
    },
    gain_energetique_estime_percentage: {
      label: "Gain énergétique estimé",
      unite: "%",
      valeur_estimee: 39,
      valeur_suivi: 32,
    },
    emission_ges_evitees_percentage: {
      label: "Émissions de GES évitées",
      unite: "%",
      valeur_estimee: 38,
      valeur_suivi: null,
    },
    nature_operations: {
      label: "Nature des opérations",
      unite: null,
      valeur_estimee: [
        "Travaux d'isolation de l'enveloppe du ou des bâtiments",
        "Travaux de rénovation énergétique",
        "Travaux de mise en conformité",
      ],
      valeur_suivi: null,
    },
    type_batiment: {
      label: "Types des bâtiments",
      unite: null,
      valeur_estimee: [
        "École (établissement public du premier degré)",
        "Établissement public du second degré",
      ],
      valeur_suivi: null,
    },
    uais: [
      {
        code_uai: "01234ABC",
        nom_uai: "Ecole primaire, Pierrepont (01234ABC)",
      },
    ],
  },
  information_financiere: {
    informations_engagement: [
      {
        annee_information_financiere: 2023,
        engagements_juridiques: [
          {
            numero_ej: "2105212345",
            nom_demarche: PROGRAM_TITLE,
            nom_axe: 1,
            montant_engage: 10073574,
            montant_engage_initial: 10073574,
            demandes_paiement: [],
          },
          {
            numero_ej: "2106789012",
            nom_demarche: PROGRAM_TITLE,
            nom_axe: 1,
            montant_engage: 2500000,
            montant_engage_initial: 2500000,
            demandes_paiement: [
              {
                numero_dp: "1009876543",
                date_dp: "2023-12-15T00:00:00",
                montant_paye: 500000,
              },
            ],
          },
        ],
      },
      {
        annee_information_financiere: 2024,
        engagements_juridiques: [
          {
            numero_ej: "2105212345",
            nom_demarche: PROGRAM_TITLE,
            nom_axe: 1,
            montant_engage: 10073574,
            montant_engage_initial: 10073574,
            demandes_paiement: [
              {
                numero_dp: "1001234567",
                date_dp: "2024-10-07T00:00:00",
                montant_paye: 3422069.2,
              },
            ],
          },
          {
            numero_ej: "2106789012",
            nom_demarche: PROGRAM_TITLE,
            nom_axe: 1,
            montant_engage: 2000000,
            montant_engage_initial: 2500000,
            demandes_paiement: [
              {
                numero_dp: "1009876544",
                date_dp: "2024-03-22T00:00:00",
                montant_paye: 750000,
              },
              {
                numero_dp: "1009876545",
                date_dp: "2024-08-05T00:00:00",
                montant_paye: 1250000,
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
            nom_demarche: PROGRAM_TITLE,
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

export const demoFinancesEJ1: FinancesEJData = {
  numero_ej: "2105212345",
  date_creation_ej: "2023-06-20T00:00:00",
  montant_engage_initial: 10073574,
  annees_informations_financieres: [
    {
      annee_information_financiere: 2023,
      montant_engage_total: 10073574,
      postes: [
        {
          numero_poste_ej: 1,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER,
          centre_couts: CENTRE_COUTS,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 10073574,
        },
      ],
    },
    {
      annee_information_financiere: 2024,
      montant_engage_total: 10073574,
      postes: [
        {
          numero_poste_ej: 1,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER,
          centre_couts: CENTRE_COUTS,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 10073574,
        },
      ],
    },
    {
      annee_information_financiere: 2025,
      montant_engage_total: 6651494.8,
      postes: [
        {
          numero_poste_ej: 1,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER,
          centre_couts: CENTRE_COUTS,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 6651494.8,
        },
      ],
    },
  ],
};

export const demoFinancesEJ2: FinancesEJData = {
  numero_ej: "2106789012",
  date_creation_ej: "2023-09-15T00:00:00",
  montant_engage_initial: 2500000,
  annees_informations_financieres: [
    {
      annee_information_financiere: 2023,
      montant_engage_total: 2500000,
      postes: [
        {
          numero_poste_ej: 1,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER_2A,
          centre_couts: CENTRE_COUTS_2A,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 1250000,
        },
        {
          numero_poste_ej: 2,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER_2B,
          centre_couts: CENTRE_COUTS_2B,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 1250000,
        },
      ],
    },
    {
      annee_information_financiere: 2024,
      montant_engage_total: 2000000,
      postes: [
        {
          numero_poste_ej: 1,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER_2C,
          centre_couts: CENTRE_COUTS_2C,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 1000000,
        },
        {
          numero_poste_ej: 2,
          numero_dossier_ds: 12345678,
          centre_financier: CENTRE_FINANCIER_2D,
          centre_couts: CENTRE_COUTS_2D,
          referentiel_programmation: "038001010102",
          referentiel_programmation_label: PROGRAM_TITLE,
          fournisseur_titulaire_nom: COMPANY_NAME,
          fournisseur_titulaire_numero: "2100012345",
          fournisseur_titulaire_siren: SIRET.slice(0, 9),
          montant_engage: 1000000,
        },
      ],
    },
  ],
};
