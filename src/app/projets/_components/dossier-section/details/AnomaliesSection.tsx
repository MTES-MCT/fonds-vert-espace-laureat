import Button from "@codegouvfr/react-dsfr/Button";

import { MetricField } from "@/components/metrics/MetricField";
import {
  MetricValueContent,
  type ScalarMetricValue,
} from "@/components/metrics/MetricValue";

type AnomalyMetricValue = {
  value: ScalarMetricValue;
  unite?: string | null;
};

type AnomalyProblem = {
  label: string;
  metric?: AnomalyMetricValue;
};

export type Anomaly = {
  indicator: string;
  declaredValue: AnomalyMetricValue;
  problem: AnomalyProblem;
  helpText: string;
};

export function AnomaliesSection({
  anomalies,
  correctionUrl,
}: {
  anomalies: Anomaly[];
  correctionUrl: string;
}) {
  if (anomalies.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="anomalies-heading"
      className="border-t-4 border-[var(--border-plain-warning)] bg-white shadow-lg"
    >
      <div className="space-y-6 p-8">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 id="anomalies-heading" className="mb-0">
                Données à vérifier
              </h3>
              <span
                aria-label={`${anomalies.length} anomalies`}
                className={`
                  mt-0.5 flex size-6 items-center justify-center rounded-full
                  bg-[var(--background-flat-warning)] text-sm font-bold text-white
                `}
              >
                {anomalies.length}
              </span>
            </div>
          </div>
          <div className="max-w-xl">
            <p className="fr-text--sm mb-0 text-[var(--text-default-grey)]">
              Ces vérifications sont automatiques et s'appuient sur les données
              du dossier. Elles servent à fiabiliser les indicateurs d'impact.
              Pour corriger, demandez au porteur de mettre à jour son dossier
              dans Démarches Numériques.
            </p>
          </div>
        </div>

        <ul
          aria-label="Liste des anomalies détectées automatiquement sur les données du dossier"
          className="list-none space-y-6 pl-0"
        >
          {anomalies.map((anomaly) => (
            <li key={anomaly.indicator}>
              <h4 className="mb-2 text-lg font-bold">{anomaly.indicator}</h4>
              <dl
                className={`
                  grid gap-8 border border-gray-200 px-8 py-6
                  sm:grid-cols-[minmax(10rem,14rem)_1fr]
                `}
              >
                <MetricField
                  label="Valeur déclarée"
                  value={anomaly.declaredValue.value}
                  unite={anomaly.declaredValue.unite}
                  bold
                />
                <div>
                  <dt className="sr-only">Anomalie détectée</dt>
                  <dd className="!mb-0">
                    <div className="flex items-center gap-1 text-base font-semibold">
                      <span
                        aria-hidden="true"
                        className={`
                          fr-icon-warning-fill fr-icon--sm text-[var(--text-default-warning)]
                        `}
                      />
                      <span>{anomaly.problem.label}</span>
                      {anomaly.problem.metric && (
                        <span>
                          <MetricValueContent
                            value={anomaly.problem.metric.value}
                            unite={anomaly.problem.metric.unite}
                          />
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs leading-tight font-normal text-[var(--text-mention-grey)]`}
                    >
                      {anomaly.helpText}
                    </div>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-end">
          <Button
            priority="secondary"
            iconId="fr-icon-external-link-line"
            iconPosition="right"
            linkProps={{
              href: correctionUrl,
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            Corriger dans Démarches Numériques
          </Button>
        </div>
      </div>
    </section>
  );
}
