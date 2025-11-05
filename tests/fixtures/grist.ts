type GristImpactRecord = {
  id: number;
  fields: {
    champ_id_ds: string;
    label_champ_ds: string;
    champ_type: string;
    action: string[];
    metriques_API_Field_Name: string;
  };
};

export const gristChampsDS: { records: GristImpactRecord[] } = {
  records: [
    {
      id: 1,
      fields: {
        champ_id_ds: "Q2hhbXAtNDc2OTEyOQ",
        label_champ_ds: "Numéro de dossier de la subvention obtenue",
        champ_type: "Lien vers un autre dossier",
        action: ["L", "à préremplir en entrée"],
        metriques_API_Field_Name: "dossier_number",
      },
    },
    {
      id: 2,
      fields: {
        champ_id_ds: "Q2hhbXAtNDc2OTEzMA",
        label_champ_ds: "Mesure Fonds vert de la subvention accordée",
        champ_type: "Choix simple",
        action: ["L", "à préremplir en entrée"],
        metriques_API_Field_Name: "demarche_title",
      },
    },
    {
      id: 3,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY1OA",
        label_champ_ds: "Consommation énergétique avant travaux (en kWhEF/an)",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "conso_energetique_avant_travaux",
      },
    },
    {
      id: 4,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY1OQ",
        label_champ_ds: "Consommation énergétique après travaux (en kWhEF/an)",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "conso_energetique_apres_travaux",
      },
    },
    {
      id: 8,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA3NzQ0NQ",
        label_champ_ds:
          "Nombre de résidents ayant accès à la nature dans un rayon d'un kilomètre",
        champ_type: "Nombre entier",
        action: ["L", "à préremplir en entrée"],
        metriques_API_Field_Name: "nombre_residents_acces_nature_rayon_un_km",
      },
    },
    {
      id: 10,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA3NzQ1Nw",
        label_champ_ds: "Surface totale renaturée (m²)",
        champ_type: "Nombre entier",
        action: ["L", "à préremplir en entrée"],
        metriques_API_Field_Name: "surface_totale_renature_m2",
      },
    },
    {
      id: 12,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA4NTE4Nw",
        label_champ_ds: "Emissions GES initiales avant travaux (en kgEqCo2/an)",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "emission_ges_avant_travaux",
      },
    },
    {
      id: 13,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA4NTE4OA",
        label_champ_ds: "Emissions GES initiales après travaux (en kgEqCo2/an)",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "emission_ges_apres_travaux",
      },
    },
    {
      id: 14,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQwMTgyMQ",
        label_champ_ds: "Date début d'exécution",
        champ_type: "Date",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "date_engagement_premiere_depense",
      },
    },
    {
      id: 15,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQwMTgyNA",
        label_champ_ds: "Date fin d'exécution",
        champ_type: "Date",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "date_achevement_depenses_financees",
      },
    },
    {
      id: 16,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTMzNw",
        label_champ_ds:
          "Montant total actualisé des dépenses du projet en euros hors taxes (€ HT)",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "total_des_depenses",
      },
    },
    {
      id: 17,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1NzkwNw",
        label_champ_ds: "Nombre de bâtiments concernés par l'opération",
        champ_type: "Nombre entier",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "nombre_batiments_renovation",
      },
    },
    {
      id: 18,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1ODgwMw",
        label_champ_ds:
          "Surface de bâtiment concernée par l'opération en m² (avant projet et hors extension)",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "surface_batiment_m2_avant_projet",
      },
    },
    {
      id: 19,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTE2Nw",
        label_champ_ds: "Type(s) de bâtiments concernés par l'opération",
        champ_type: "Choix multiple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "type_batiment",
      },
    },
    {
      id: 20,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTI5NQ",
        label_champ_ds:
          "Parmi les postes de dépenses du projet de rénovation de l'établissement scolaire, certains concernent-ils des opérations de renaturation ?",
        champ_type: "Oui/Non",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "est_renaturation_batiment_scolaire",
      },
    },
    {
      id: 21,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTI5Mg",
        label_champ_ds: "Surface renaturée en m²",
        champ_type: "Nombre décimal",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "surface_renaturee_ecole",
      },
    },
    {
      id: 22,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1NzE5OQ",
        label_champ_ds:
          "Nature de l'opération (métropole et Saint-Pierre-et-Miquelon)",
        champ_type: "Choix simple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name:
          "nature_operation_metro_saint_pierre_et_miquelon",
      },
    },
    {
      id: 23,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTI5Nw",
        label_champ_ds: "Nature de l'opération de rénovation énergétique",
        champ_type: "Choix simple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "nature_operation",
      },
    },
    {
      id: 24,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1ODc4Mg",
        label_champ_ds: "Type(s) de gestes conforts d'été prévus",
        champ_type: "Choix multiple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "types_gestes_conforts_ete",
      },
    },
    {
      id: 25,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTMwMQ",
        label_champ_ds: "Nature des opérations situées en Outre-Mer",
        champ_type: "Choix multiple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "nature_operation_en_outre_mer",
      },
    },
    {
      id: 26,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTMwMw",
        label_champ_ds: "Geste(s) sur l'enveloppe du bâti - précision",
        champ_type: "Choix multiple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "gestes_enveloppe_bati",
      },
    },
    {
      id: 27,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTMwNw",
        label_champ_ds:
          "Nombre de gestes de travaux portant sur l'enveloppe du bâti",
        champ_type: "Nombre entier",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "nombre_gestes_enveloppe_bati",
      },
    },
    {
      id: 28,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTMwNQ",
        label_champ_ds: "Geste(s) sur les équipements - précision",
        champ_type: "Choix multiple",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "gestes_equipements",
      },
    },
    {
      id: 29,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTMwNg",
        label_champ_ds:
          "Nombre de gestes de travaux portant sur les équipements",
        champ_type: "Nombre entier",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "nombre_gestes_equipement",
      },
    },
    {
      id: 30,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ1OTM1Nw",
        label_champ_ds: "Statut de réalisation du projet subventionné",
        champ_type: "Choix simple",
        action: ["L", "à récupérer en sortie"],
        metriques_API_Field_Name: "statut_realisation_projet",
      },
    },
    {
      id: 31,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ3OTk2NQ",
        label_champ_ds: "Localisation du projet",
        champ_type: "Choix simple",
        action: ["L", "à préremplir en entrée"],
        metriques_API_Field_Name: "localisation_metropole_outre_mer",
      },
    },
    {
      id: 32,
      fields: {
        champ_id_ds: "Q2hhbXAtNTU1NDMwMA",
        label_champ_ds: "",
        champ_type: "Texte court",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "nom_du_projet",
      },
    },
    {
      id: 33,
      fields: {
        champ_id_ds: "Q2hhbXAtNTU1NDMwMQ",
        label_champ_ds: "",
        champ_type: "Texte long",
        action: ["L", "à préremplir en entrée"],
        metriques_API_Field_Name: "resume_du_projet",
      },
    },
    {
      id: 34,
      fields: {
        champ_id_ds: "Q2hhbXAtNTQ4NDQ0Mg",
        label_champ_ds: "",
        champ_type: "Date",
        action: ["L", "à préremplir en entrée", "à récupérer en sortie"],
        metriques_API_Field_Name: "date_notification",
      },
    },
  ],
};
