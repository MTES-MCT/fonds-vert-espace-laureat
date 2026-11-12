import type { Dossier } from "@/services/ds/subvention";
import { readFondsVertSignals } from "@/services/fondsvert/anomalies";
import type {
  DossierFondsVert,
  InformationFinanciere,
  Metrics,
} from "@/services/fondsvert/dossier";
import type { FinancesEJResult } from "@/services/fondsvert/finances";
import {
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
  demoPoolDossier,
} from "@/utils/demo";
import { demoInitialSignals } from "@/utils/demo/anomalies";
import {
  DEMO_COMPOST_NUMBER,
  DEMO_GYM_NUMBER,
  DEMO_SCHOOL_NUMBER,
} from "@/utils/demo/reservation";
import type { DossierProgressStatus } from "@/utils/dossierProgress";
import type { ProjectView } from "@/utils/projectView";

type DemoProject = {
  dossier: Dossier;
  fondsVert: DossierFondsVert;
  signals: ReturnType<typeof readFondsVertSignals>;
  status: DossierProgressStatus | null;
  finances?: FinancesEJResult;
};

type FinanceExercise = { year: number; committed: number; payments: number[] };

const nantes = {
  name: demoDossierFondsVert.socle_commun.entreprise_raison_sociale,
  commune: demoDossierFondsVert.socle_commun.nom_commune,
  siret: demoPoolDossier.demandeur.siret,
  email: demoPoolDossier.champs.emailRepresentantLegal,
  department: demoPoolDossier.champs.departementImplantation,
};
const rives = {
  name: "Communauté de communes des Rives",
  commune: "Les Rives",
  siret: "00000000200002",
  email: "rives@example.test",
  department: "05 — Hautes-Alpes",
};
const energyRenovation = "Rénovation énergétique des bâtiments publics";

const schoolImpact: Metrics = {
  nature_operations: {
    label: "Nature des opérations",
    unite: null,
    valeur_estimee: [
      "Isolation des façades et des combles",
      "Remplacement de la chaudière par une pompe à chaleur",
    ],
  },
  type_batiment: {
    label: "Types des bâtiments",
    unite: null,
    valeur_estimee: ["École (établissement public du premier degré)"],
  },
  surface_batiment_m2_avant_projet: {
    label: "Surface du bâtiment avant projet",
    unite: "m²",
    valeur_estimee: 1_250,
  },
  surface_batiment_m2_apres_projet: {
    label: "Surface du bâtiment après projet",
    unite: "m²",
    valeur_estimee: 1_250,
  },
  type_surface: {
    label: "Type de surface",
    unite: null,
    valeur_estimee: "Surface de plancher",
  },
  systeme_chauffage_avant_travaux: {
    label: "Système de chauffage avant travaux",
    unite: null,
    valeur_estimee: "Chaudière au gaz naturel",
  },
  systeme_chauffage_apres_travaux: {
    label: "Système de chauffage après travaux",
    unite: null,
    valeur_estimee: "Pompe à chaleur air-eau",
  },
  conso_energetique_avant_travaux: {
    label: "Consommation énergétique avant travaux",
    unite: "kWh",
    valeur_estimee: 180_000,
  },
  conso_energetique_apres_travaux: {
    label: "Consommation énergétique après travaux",
    unite: "kWh",
    valeur_estimee: 125_000,
  },
  gain_energetique_estime_percentage: {
    label: "Gain énergétique estimé",
    unite: "%",
    valeur_estimee: 30.6,
  },
  emission_ges_avant_travaux: {
    label: "Émissions de GES avant travaux",
    unite: "kgCO₂e",
    valeur_estimee: 41_400,
  },
  emission_ges_apres_travaux: {
    label: "Émissions de GES après travaux",
    unite: "kgCO₂e",
    valeur_estimee: 11_250,
  },
  emission_ges_evitees_percentage: {
    label: "Émissions de GES évitées",
    unite: "%",
    valeur_estimee: 72.8,
  },
};

const gymImpact: Metrics = {
  nature_operations: {
    label: "Nature des opérations",
    unite: null,
    valeur_estimee: [
      "Isolation de la toiture et des façades",
      "Remplacement de la chaudière et régulation du chauffage",
    ],
  },
  type_batiment: {
    label: "Types des bâtiments",
    unite: null,
    valeur_estimee: ["Gymnase intercommunal"],
  },
  surface_batiment_m2_avant_projet: {
    label: "Surface du bâtiment avant projet",
    unite: "m²",
    valeur_estimee: 1_800,
  },
  surface_batiment_m2_apres_projet: {
    label: "Surface du bâtiment après projet",
    unite: "m²",
    valeur_estimee: 1_800,
  },
  type_surface: {
    label: "Type de surface",
    unite: null,
    valeur_estimee: "Surface de plancher",
  },
  systeme_chauffage_avant_travaux: {
    label: "Système de chauffage avant travaux",
    unite: null,
    valeur_estimee: "Chaudière au gaz naturel",
  },
  systeme_chauffage_apres_travaux: {
    label: "Système de chauffage après travaux",
    unite: null,
    valeur_estimee: "Chaudière gaz à condensation",
  },
  conso_energetique_avant_travaux: {
    label: "Consommation énergétique avant travaux",
    unite: "kWh",
    valeur_estimee: 230_000,
  },
  conso_energetique_apres_travaux: {
    label: "Consommation énergétique après travaux",
    unite: "kWh",
    valeur_estimee: 150_000,
  },
  gain_energetique_estime_percentage: {
    label: "Gain énergétique estimé",
    unite: "%",
    valeur_estimee: 34.8,
  },
  emission_ges_avant_travaux: {
    label: "Émissions de GES avant travaux",
    unite: "kgCO₂e",
    valeur_estimee: 52_900,
  },
  emission_ges_apres_travaux: {
    label: "Émissions de GES après travaux",
    unite: "kgCO₂e",
    valeur_estimee: 34_500,
  },
  emission_ges_evitees_percentage: {
    label: "Émissions de GES évitées",
    unite: "%",
    valeur_estimee: 34.8,
  },
};

function projectFinancing(
  number: number,
  programme: string,
  grant: number,
  exercises: [FinanceExercise, ...FinanceExercise[]],
) {
  const engagementNumber = `2109000${number}`;
  const informationFinanciere: InformationFinanciere = {
    informations_engagement: exercises.map(({ year, committed, payments }) => ({
      annee_information_financiere: year,
      montant_paye_per_dossier: payments.reduce(
        (sum, amount) => sum + amount,
        0,
      ),
      etat_engagement: payments.length ? "en cours" : "sans paiement",
      engagements_juridiques: [
        {
          numero_ej: engagementNumber,
          nom_demarche: programme,
          nom_axe: 1,
          montant_engage: committed,
          demandes_paiement: payments.map((amount, index) => ({
            numero_dp: `10${year}${number}${index + 1}`,
            date_dp: `${year}-${index === 0 ? "09-18" : "10-20"}`,
            montant_paye: amount,
          })),
        },
      ],
    })),
  };
  const finances: FinancesEJResult = {
    [engagementNumber]: {
      success: true,
      data: {
        numero_ej: engagementNumber,
        date_creation_ej: `${exercises[0].year}-06-12`,
        montant_engage_initial: grant,
        annees_informations_financieres: exercises.map(
          ({ year, committed }) => ({
            annee_information_financiere: year,
            montant_engage_total: committed,
            postes: [],
          }),
        ),
      },
    },
  };
  return { engagementNumber, informationFinanciere, finances };
}

function project({
  number,
  holder,
  programme,
  name,
  summary,
  grant,
  year,
  status,
  exercises,
  metrics,
  anomalyLabels = [],
}: {
  number: number;
  holder: typeof nantes;
  programme: string;
  name: string;
  summary: string;
  grant: number;
  year: number;
  status: DossierProgressStatus;
  exercises: [FinanceExercise, ...FinanceExercise[]];
  metrics: Metrics;
  anomalyLabels?: string[];
}): DemoProject {
  const { engagementNumber, informationFinanciere, finances } =
    projectFinancing(number, programme, grant, exercises);
  const date = `${year}-06-12`;
  const dossier: Dossier = {
    numero: number,
    demandeur: {
      siret: holder.siret,
    },
    demarche: { title: `FONDS VERT - ${programme}` },
    champs: {
      intituleProjet: name,
      numeroEngagementJuridique: engagementNumber,
      autresNumerosEngagementJuridique: [],
      departementImplantation: holder.department,
      resumeProjet: summary,
      emailRepresentantLegal: holder.email,
      dateSignatureDecision: new Date(date),
      montantSubventionAttribuee: grant,
    },
  };
  const fondsVert: DossierFondsVert = {
    socle_commun: {
      demarche_title: programme,
      annee_millesime: year,
      date_notification: date,
      date_depot: `${year}-03-10`,
      date_derniere_modification: date,
      date_debut_execution: status === "Non-commencé" ? null : date,
      date_fin_execution: null,
      entreprise_raison_sociale: holder.name,
      siret: holder.siret,
      nom_commune: holder.commune,
      montant_subvention_attribuee: grant,
      total_des_depenses: grant * 2,
    },
    metrique_specifique: metrics,
    information_financiere: informationFinanciere,
  };
  const signals = readFondsVertSignals({
    anomalies: {
      est_anomalie: anomalyLabels.length > 0,
      est_error: false,
      anomalie_demarche_list: [],
      anomalie_indicateur_list: anomalyLabels,
      error_indicateur_list: [],
    },
    avertissements: [],
  });
  return { dossier, fondsVert, status, signals, finances };
}

const projects: DemoProject[] = [
  project({
    number: DEMO_SCHOOL_NUMBER,
    holder: nantes,
    programme: energyRenovation,
    name: "Rénovation de l’école des Tilleuls",
    summary: "Isolation et rénovation du chauffage de l’école communale.",
    grant: 180_000,
    year: 2025,
    status: "En cours de réalisation",
    exercises: [
      { year: 2025, committed: 36_000, payments: [36_000] },
      { year: 2026, committed: 144_000, payments: [45_000, 27_000] },
    ],
    metrics: schoolImpact,
    anomalyLabels: ["Consommation énergétique avant travaux"],
  }),
  {
    dossier: demoPoolDossier,
    fondsVert: demoDossierFondsVert,
    signals: demoInitialSignals,
    status: null,
    finances: {
      [demoFinancesEJ1.numero_ej]: { success: true, data: demoFinancesEJ1 },
      [demoFinancesEJ2.numero_ej]: { success: true, data: demoFinancesEJ2 },
    },
  },
  project({
    number: DEMO_COMPOST_NUMBER,
    holder: rives,
    programme: "Biodéchets",
    name: "Collecte séparée des biodéchets",
    summary:
      "Collecte des déchets alimentaires en zone dense et compostage de proximité dans les communes rurales.",
    grant: 76_000,
    year: 2025,
    status: "En cours de réalisation",
    exercises: [{ year: 2025, committed: 76_000, payments: [22_800] }],
    metrics: {
      nature_operations: {
        label: "Nature des opérations",
        unite: null,
        valeur_estimee: [
          "Installation de bornes d’apport volontaire pour les déchets alimentaires",
          "Distribution de composteurs et accompagnement des habitants",
        ],
      },
      nombre_habitant_collecte_separee: {
        label: "Habitants concernés par la collecte séparée",
        unite: null,
        valeur_estimee: 8_400,
      },
      quantite_globale_annuel_biodechets_collectes: {
        label: "Quantité annuelle de biodéchets collectés",
        unite: "t",
        valeur_estimee: 240,
      },
      nombre_habitant_gestion_proximite: {
        label: "Nombre d’habitants pratiquant la gestion de proximité",
        unite: null,
        valeur_estimee: 2_100,
      },
      tonnage_annuel_entrant_gestion_proximite: {
        label: "Tonnage annuel entrant en gestion de proximité",
        unite: "t",
        valeur_estimee: 72,
      },
    },
  }),
  project({
    number: DEMO_GYM_NUMBER,
    holder: rives,
    programme: energyRenovation,
    name: "Rénovation du gymnase des Rives",
    summary:
      "Isolation et modernisation des installations du gymnase intercommunal.",
    grant: 130_000,
    year: 2025,
    status: "Non-commencé",
    exercises: [{ year: 2025, committed: 130_000, payments: [] }],
    metrics: gymImpact,
  }),
];

export function demoProjects(view: ProjectView = "instructeur") {
  return projects.filter(
    ({ dossier }) =>
      view === "instructeur" || dossier.demandeur.siret === nantes.siret,
  );
}

export function demoProject(number: number, view?: ProjectView) {
  return demoProjects(view).find(({ dossier }) => dossier.numero === number);
}
