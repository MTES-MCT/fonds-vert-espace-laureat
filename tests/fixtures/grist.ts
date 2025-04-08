type GristImpactRecord = {
  id: number;
  fields: {
    champ_id_ds: string;
    label_champ_ds: string;
    champ_type: string;
    action: string;
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
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 2,
      fields: {
        champ_id_ds: "Q2hhbXAtNDc2OTEzMA",
        label_champ_ds: "Mesure Fonds vert de la subvention accordée",
        champ_type: "Choix simple",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 3,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY1OA",
        label_champ_ds:
          "Consommation énergétique avant travaux (en kWhEF/an) [VALEUR DÉCLARÉE]",
        champ_type: "Nombre décimal",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "conso_energetique_avant_travaux",
      },
    },
    {
      id: 4,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY1OQ",
        label_champ_ds:
          "Consommation énergétique après travaux (en kWhEF/an) [VALEUR INITIALE]",
        champ_type: "Nombre décimal",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "conso_energetique_apres_travaux",
      },
    },
    {
      id: 5,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY2MQ",
        label_champ_ds:
          "Consommation énergétique après travaux (en kWhEF/an) [VALEUR FINALE]",
        champ_type: "Nombre décimal",
        action: "à récupérer en sortie",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 6,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY2MA",
        label_champ_ds: "Gain énergétique (en %) [VALEUR INITIALE]",
        champ_type: "Nombre décimal",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "gain_energetique_estime_percentage",
      },
    },
    {
      id: 7,
      fields: {
        champ_id_ds: "Q2hhbXAtNDgwMTY2Mg",
        label_champ_ds: "Gain énergétique (en %) [VALEUR FINALE]",
        champ_type: "Nombre décimal",
        action: "à récupérer en sortie",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 8,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA3NzQ0NQ",
        label_champ_ds:
          "Nombre de résidents ayant accès à la nature dans un rayon d'un kilomètre [VALEUR INITIALE]",
        champ_type: "Nombre entier",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "nombre_residents_acces_nature_rayon_un_km",
      },
    },
    {
      id: 9,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA3NzQ0Nw",
        label_champ_ds:
          "Nombre de résidents ayant accès à la nature dans un rayon d'un kilomètre [VALEUR FINALE]",
        champ_type: "Nombre entier",
        action: "à récupérer en sortie",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 10,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA3NzQ1Nw",
        label_champ_ds: "Surface totale renaturée (m²) [VALEUR INITIALE]",
        champ_type: "Nombre entier",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "surface_totale_renature_m2",
      },
    },
    {
      id: 11,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA3NzQ1OQ",
        label_champ_ds: "Surface totale renaturée (m²) [VALEUR FINALE]",
        champ_type: "Nombre entier",
        action: "à récupérer en sortie",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 12,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA4NTE4Nw",
        label_champ_ds:
          "Emissions GES initiales avant travaux (en kgEqCo2/an) [VALEUR DÉCLARÉE]",
        champ_type: "Nombre décimal",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "emission_ges_avant_travaux",
      },
    },
    {
      id: 13,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA4NTE4OA",
        label_champ_ds:
          "Emissions GES initiales après travaux (en kgEqCo2/an) [VALEUR INITIALE]",
        champ_type: "Nombre décimal",
        action: "à préremplir en entrée",
        metriques_API_Field_Name: "emission_ges_apres_travaux",
      },
    },
    {
      id: 14,
      fields: {
        champ_id_ds: "Q2hhbXAtNTA4NTUxMw",
        label_champ_ds:
          "Emissions GES initiales après travaux (en kgEqCo2/an) [VALEUR FINALE]",
        champ_type: "Nombre décimal",
        action: "à récupérer en sortie",
        metriques_API_Field_Name: "",
      },
    },
    {
      id: 15,
      fields: {
        champ_id_ds: "Q2hhbXAtNDc2OTEzMQ",
        label_champ_ds: "Statut du projet financé",
        champ_type: "Liste simple",
        action: "à récupérer en sortie",
        metriques_API_Field_Name: "",
      },
    },
  ],
};
