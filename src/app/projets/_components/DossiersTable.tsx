import { ReactNode } from "react";

import { DossierProgressBadge } from "@/components/dossier-progress/DossierProgressBadge";
import {
  anomalyCategoryLabels,
  FondsVertAnomalyStatus,
  fondsVertAnomalySummary,
} from "@/components/metrics/FondsVertAnomalyStatus";
import type { DossierProgressTarget } from "@/db/dossierProgress";
import { Dossier } from "@/services/ds/subvention";
import { readFondsVertSignals } from "@/services/fondsvert/anomalies";
import type { DossierFondsVertSummary } from "@/services/fondsvert/dossiers";
import { formatDate, formatEuros } from "@/utils/format";
import { normalizeFondsVertAnomalies } from "@/utils/metrics/anomalies";
import type { ProjectView } from "@/utils/projectView";

interface DossiersTableProps {
  dossiers: Dossier[];
  view?: ProjectView;
  summaries: Record<number, DossierFondsVertSummary>;
  progress: Record<number, DossierProgressTarget>;
}

function DsfrTable({ children }: { children: ReactNode }) {
  return (
    <div className="fr-table fr-table--lg mb-0 max-w-full">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DossiersTable({
  dossiers,
  view,
  summaries,
  progress,
}: DossiersTableProps) {
  const instructorView = view === "instructeur";
  return (
    <DsfrTable>
      <table>
        <thead>
          <tr>
            <th scope="col">Dossier</th>
            <th scope="col">Projet</th>
            <th scope="col">Signalements</th>
            {instructorView && (
              <>
                <th scope="col">Porteur</th>
                <th scope="col">Territoire</th>
                <th scope="col">Dispositif</th>
                <th scope="col">Avancement</th>
              </>
            )}
            <th scope="col">Subvention attribuée</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => {
            const summary = summaries[dossier.numero];
            const anomalies = normalizeFondsVertAnomalies(
              summary?.signals ?? readFondsVertSignals({}),
            );
            const warnings = anomalies.warnings;
            return (
              <tr key={dossier.numero}>
                <td>{dossier.numero}</td>
                <td className="min-w-52 max-w-lg whitespace-normal [overflow-wrap:anywhere]">
                  <a href={`/projets/${dossier.numero}`}>
                    {dossier.champs.intituleProjet || "Non renseigné"}
                  </a>
                </td>
                <td className="min-w-52 whitespace-normal [overflow-wrap:anywhere]">
                  <a
                    href={`/projets/${dossier.numero}/impact#signalements`}
                    aria-label={`${fondsVertAnomalySummary(anomalies).label} pour le projet n°${dossier.numero}`}
                  >
                    <FondsVertAnomalyStatus anomalies={anomalies} />
                  </a>
                  {(anomalies.status === "incomplete" ||
                    anomalies.status === "invalid") &&
                    (anomalies.indicatorCount > 0 ||
                      anomalies.unspecifiedCategories.length > 0 ||
                      anomalies.contextLabels.length > 0) && (
                      <p className="mb-0 mt-2 text-xs">
                        Signalements incomplets
                      </p>
                    )}
                  {anomalies.indicators.length > 0 && (
                    <ul className="mb-0 mt-2 pl-4 text-xs">
                      {anomalies.indicators.map((indicator) => (
                        <li key={indicator.id}>
                          {indicator.label} —{" "}
                          {indicator.categories
                            .map((category) => anomalyCategoryLabels[category])
                            .join(", ")}
                        </li>
                      ))}
                    </ul>
                  )}
                  {anomalies.unspecifiedCategories.map((category) => (
                    <p key={category} className="mb-0 mt-2 text-xs">
                      {anomalyCategoryLabels[category]} : indicateur non précisé
                    </p>
                  ))}
                  {anomalies.contextLabels.map((label) => (
                    <p key={label} className="mb-0 mt-2 text-xs">
                      {label}
                    </p>
                  ))}
                  {(warnings.status === "loaded" ||
                    warnings.status === "incomplete") &&
                    warnings.data.map((warning) => (
                      <p key={warning} className="mb-0 mt-2 text-xs">
                        {warning}
                      </p>
                    ))}
                  {(warnings.status === "incomplete" ||
                    warnings.status === "invalid") && (
                    <p className="mb-0 mt-2 text-xs">
                      Avertissements incomplets
                    </p>
                  )}
                  {warnings.status === "unavailable" && (
                    <p className="mb-0 mt-2 text-xs">
                      Avertissements indisponibles
                    </p>
                  )}
                </td>
                {instructorView && (
                  <>
                    <td className="min-w-40 whitespace-normal [overflow-wrap:anywhere]">
                      {summary?.socleCommun?.entreprise_raison_sociale ||
                        "Non renseigné"}
                    </td>
                    <td className="min-w-40 whitespace-normal">
                      <div>
                        Commune :{" "}
                        {summary?.socleCommun?.nom_commune || "Non renseignée"}
                      </div>
                      <div>
                        Département :{" "}
                        {dossier.champs.departementImplantation ||
                          "Non renseigné"}
                      </div>
                    </td>
                    <td className="min-w-52 whitespace-normal [overflow-wrap:anywhere]">
                      <div>
                        {dossier.demarche.title.replace("FONDS VERT - ", "")}
                      </div>
                      <div>
                        {summary?.socleCommun?.annee_millesime
                          ? `Édition ${summary.socleCommun.annee_millesime}`
                          : "Millésime non renseigné"}
                      </div>
                    </td>
                    <td>
                      <DossierProgressBadge
                        status={progress[dossier.numero]?.status ?? null}
                      />
                    </td>
                  </>
                )}
                <td>
                  <div className="text-lg font-semibold">
                    {formatEuros(dossier.champs.montantSubventionAttribuee)}
                  </div>
                  <div className="text-xs">
                    {dossier.champs.dateSignatureDecision
                      ? `le ${formatDate(dossier.champs.dateSignatureDecision)}`
                      : "Date de décision non renseignée"}
                  </div>
                </td>
                <td>
                  <a
                    className="fr-btn fr-btn--secondary"
                    href={`/projets/${dossier.numero}`}
                  >
                    Ouvrir
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DsfrTable>
  );
}
