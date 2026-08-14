"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { useState } from "react";

import { MetricCorrectionEditor } from "@/components/metrics/MetricCorrectionEditor";
import { MetricField } from "@/components/metrics/MetricField";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
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
  metricCode: string;
  indicator: string;
  problem: AnomalyProblem;
  helpText: string;
};

export function AnomaliesSection({ anomalies }: { anomalies: Anomaly[] }) {
  const { targets } = useMetricRevisions();
  const [successMessage, setSuccessMessage] = useState<string>();

  if (anomalies.length === 0 && !successMessage) {
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
              {anomalies.length > 0 && (
                <span
                  aria-label={`${anomalies.length} anomalies`}
                  className={`
                    mt-0.5 flex size-6 items-center justify-center rounded-full
                    bg-[var(--background-flat-warning)] text-sm font-bold text-white
                  `}
                >
                  {anomalies.length}
                </span>
              )}
            </div>
          </div>
          <div className="max-w-xl">
            <p className="fr-text--sm mb-0 text-[var(--text-default-grey)]">
              Ces vérifications sont automatiques et s'appuient sur les données
              du dossier. Elles servent à fiabiliser les indicateurs d'impact.
              Vous pouvez corriger une valeur ici ou demander au porteur de
              mettre à jour son dossier dans Démarches Numériques.
            </p>
          </div>
        </div>

        {successMessage && (
          <Alert
            severity="success"
            small
            description={successMessage}
            role="status"
          />
        )}

        <ul
          aria-label="Liste des anomalies détectées automatiquement sur les données du dossier"
          className="list-none space-y-6 pl-0"
        >
          {anomalies.map((anomaly) => {
            const target = targets[anomaly.metricCode];
            if (!target || Array.isArray(target.effectiveValue)) {
              return null;
            }

            return (
              <li className="space-y-2" key={anomaly.metricCode}>
                <h4 className="mb-0 text-lg font-bold">{anomaly.indicator}</h4>
                <dl
                  className={`
                    grid items-start gap-6 border border-gray-200 px-6 py-6
                    sm:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)_auto]
                  `}
                >
                  <MetricField
                    label="Valeur déclarée"
                    value={target.effectiveValue}
                    unite={target.unit}
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
                        className={`
                          text-xs leading-tight font-normal text-[var(--text-mention-grey)]
                        `}
                      >
                        {anomaly.helpText}
                      </div>
                    </dd>
                  </div>
                  <div className="justify-self-end">
                    <MetricCorrectionEditor
                      target={target}
                      buttonLabel="Modifier"
                      successFeedback="parent"
                      onSuccess={() =>
                        setSuccessMessage(
                          `Correction enregistrée pour « ${target.label} ».`,
                        )
                      }
                    />
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
