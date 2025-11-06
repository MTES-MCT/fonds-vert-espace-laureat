import { Dossier } from "@/services/ds/subvention";
import { DossierFondsVert } from "@/services/fondsvert/dossier";

import {
  CHORUS_NUMBER,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
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
    departementImplantation: "Nantes",
    montantSubventionAttribuee: 10073574,
    emailRepresentantLegal: LEGAL_REPRESENTATIVE_EMAIL,
    emailResponsableSuivi: "bob.doe@example.com",
    dateSignatureDecision: new Date(),
    numeroEngagementJuridique: "987654",
    autresNumerosEngagementJuridique: ["123456", "654321"],
  },
};

export const demoDossierFondsVert: DossierFondsVert = {
  socle_commun: {
    demarche_title: PROGRAM_TITLE,
    date_debut_execution: "2024-01-15",
    date_fin_execution: "2025-12-31",
    total_des_depenses: 899700,
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
  },
  information_financiere: {
    centre_financier_chorus: CHORUS_NUMBER,
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
