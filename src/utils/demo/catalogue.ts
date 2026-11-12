import type { Dossier } from "@/services/ds/subvention";
import {
  readFondsVertSignals,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";
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
import { DEMO_DOSSIER_NUMBERS } from "@/utils/demo/reservation";
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

const communes = [
  {
    name: demoDossierFondsVert.socle_commun.entreprise_raison_sociale,
    commune: demoDossierFondsVert.socle_commun.nom_commune,
    siret: demoPoolDossier.demandeur.siret,
    email: demoPoolDossier.champs.emailRepresentantLegal,
    department: demoPoolDossier.champs.departementImplantation,
  },
  {
    name: "Communauté de communes des Rives",
    commune: "Les Rives",
    siret: "00000000200002",
    email: "rives@example.test",
    department: "05 — Hautes-Alpes",
  },
];

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

function project(
  index: number,
  name: string,
  summary: string,
  grant: number,
  year: number,
  status: DossierProgressStatus,
  exercises: [FinanceExercise, ...FinanceExercise[]],
  metrics?: Metrics,
) {
  const holder = communes[index < 2 ? 0 : 1];
  const number = DEMO_DOSSIER_NUMBERS[index];
  const programme =
    index === 2 ? "Biodéchets" : "Rénovation énergétique des bâtiments publics";
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
      date_debut_execution: index === 3 ? null : date,
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
  const signals = !metrics
    ? unavailableFondsVertSignals()
    : readFondsVertSignals({
        anomalies: {
          est_anomalie: index === 0,
          est_error: false,
          anomalie_demarche_list: [],
          anomalie_indicateur_list:
            index === 0 ? ["Consommation énergétique avant travaux"] : [],
          error_indicateur_list: [],
        },
        avertissements: [],
      });
  return { dossier, fondsVert, status, signals, finances };
}

const projects: DemoProject[] = [
  project(
    0,
    "Rénovation de l’école des Tilleuls",
    "Isolation et rénovation du chauffage de l’école communale.",
    180_000,
    2025,
    "En cours de réalisation",
    [
      { year: 2025, committed: 36_000, payments: [36_000] },
      { year: 2026, committed: 144_000, payments: [45_000, 27_000] },
    ],
    schoolImpact,
  ),
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
  project(
    2,
    "Collecte séparée des biodéchets",
    "Mise en place d’une collecte séparée des déchets alimentaires.",
    76_000,
    2025,
    "En cours de réalisation",
    [{ year: 2025, committed: 76_000, payments: [22_800] }],
    {
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
    },
  ),
  project(
    3,
    "Rénovation du gymnase des Rives",
    "Isolation et modernisation des installations du gymnase intercommunal.",
    130_000,
    2025,
    "Non-commencé",
    [{ year: 2025, committed: 130_000, payments: [] }],
  ),
];

export function demoProjects(view: ProjectView = "instructeur") {
  return projects.filter(
    ({ dossier }) =>
      view === "instructeur" || dossier.demandeur.siret === communes[0].siret,
  );
}

export function demoProject(number: number, view?: ProjectView) {
  return demoProjects(view).find(({ dossier }) => dossier.numero === number);
}
