UPDATE "dossier_metric_revisions" AS metric
SET "number_value" = demo.new_value
FROM (VALUES
  (101, 'conso_energetique_avant_travaux', 180000, 18000),
  (101, 'emission_ges_evitees_percentage', 72.8, 172.8),
  (102, 'conso_energetique_avant_travaux', 2055650, 205565),
  (102, 'emission_ges_avant_travaux', 448, -448)
) AS demo(dossier_number, metric_code, old_value, new_value)
WHERE metric.dossier_number = demo.dossier_number
  AND metric.metric_code = demo.metric_code
  AND metric.revision = 1
  AND metric.number_value = demo.old_value;
