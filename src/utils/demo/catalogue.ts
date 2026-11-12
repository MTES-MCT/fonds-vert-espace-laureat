import type { Dossier } from "@/services/ds/subvention";
import {
  readFondsVertSignals,
  unavailableFondsVertSignals,
} from "@/services/fondsvert/anomalies";
import type { DossierFondsVert, Metrics } from "@/services/fondsvert/dossier";
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

function energyMetrics(
  surface: number,
  before: number,
  after: number,
): Metrics {
  return {
    surface_batiment_m2_avant_projet: {
      label: "Surface du bâtiment avant projet",
      unite: "m²",
      valeur_estimee: surface,
    },
    conso_energetique_avant_travaux: {
      label: "Consommation énergétique avant travaux",
      unite: "kWh",
      valeur_estimee: before,
    },
    conso_energetique_apres_travaux: {
      label: "Consommation énergétique après travaux",
      unite: "kWh",
      valeur_estimee: after,
    },
  };
}

function project(
  index: number,
  name: string,
  summary: string,
  grant: number,
  year: number,
  status: DossierProgressStatus,
  metrics?: Metrics,
) {
  const holder = communes[index < 2 ? 0 : 1];
  const number = DEMO_DOSSIER_NUMBERS[index];
  const programme =
    index === 2 ? "Biodéchets" : "Rénovation énergétique des bâtiments publics";
  const date = `${year}-06-12`;
  const dossier: Dossier = {
    numero: number,
    demandeur: {
      siret: holder.siret,
    },
    demarche: { title: `FONDS VERT - ${programme}` },
    champs: {
      intituleProjet: name,
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
  return { dossier, fondsVert, status, signals };
}

const projects: DemoProject[] = [
  project(
    0,
    "Rénovation de l’école des Tilleuls",
    "Isolation et rénovation du chauffage de l’école communale.",
    180_000,
    2025,
    "En cours de réalisation",
    energyMetrics(1_250, 180_000, 125_000),
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
