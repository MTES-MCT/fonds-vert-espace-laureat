import Badge from "@codegouvfr/react-dsfr/Badge";

import { DossierProgressBadge } from "@/components/dossier-progress/DossierProgressBadge";
import { fondsVertListAnomalySummary } from "@/components/metrics/FondsVertAnomalyStatus";
import { DsfrTable } from "@/components/table/DsfrTable";
import type { DossierProgressTarget } from "@/db/dossierProgress";
import { Dossier } from "@/services/ds/subvention";
import { readFondsVertSignals } from "@/services/fondsvert/anomalies";
import type { DossierFondsVertSummary } from "@/services/fondsvert/dossiers";
import { formatDate, formatEuros } from "@/utils/format";
import { normalizeFondsVertAnomalies } from "@/utils/metrics/anomalies";
import type { ProjectView } from "@/utils/projectView";

interface DossiersTableProps {
  dossiers: Dossier[];
  projectLink?: (number: number, impact?: boolean) => string;
  view?: ProjectView;
  summaries: Record<number, DossierFondsVertSummary>;
  progress: Record<number, DossierProgressTarget>;
}

export default function DossiersTable({
  dossiers,
  projectLink = (number, impact) =>
    `/projets/${number}${impact ? "/impact#signalements" : ""}`,
  view,
  summaries,
  progress,
}: DossiersTableProps) {
  const instructorView = view === "instructeur";
  return (
    <DsfrTable
      label="Tableau des projets"
      className="fr-table--lg mb-0 max-w-full"
    >
      <table>
        <thead>
          <tr>
            <th scope="col">Dossier</th>
            <th scope="col">Projet</th>
            <th scope="col">Signalements</th>
            {instructorView && <th scope="col">Avancement</th>}
            <th scope="col">Subvention attribuée</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => {
            const summary = summaries[dossier.numero];
            const anomalies = normalizeFondsVertAnomalies(
              summary?.signals ?? readFondsVertSignals({}),
            );
            const { label, severity } = fondsVertListAnomalySummary(anomalies);
            return (
              <tr key={dossier.numero}>
                <td>{dossier.numero}</td>
                <td className="min-w-52 max-w-lg whitespace-normal [overflow-wrap:anywhere]">
                  <a className="fr-link" href={projectLink(dossier.numero)}>
                    {dossier.champs.intituleProjet || "Non renseigné"}
                  </a>
                  {instructorView && (
                    <div className="mt-1 text-xs">
                      {summary?.socleCommun?.entreprise_raison_sociale ||
                        "Porteur non renseigné"}
                    </div>
                  )}
                </td>
                <td className="min-w-52 whitespace-normal [overflow-wrap:anywhere]">
                  <a
                    className="fr-raw-link inline-block"
                    href={projectLink(dossier.numero, true)}
                    aria-label={`${label} pour le projet n°${dossier.numero}`}
                  >
                    <Badge as="span" small noIcon severity={severity}>
                      {label}
                    </Badge>
                  </a>
                </td>
                {instructorView && (
                  <td>
                    <DossierProgressBadge
                      status={progress[dossier.numero]?.status ?? null}
                    />
                  </td>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </DsfrTable>
  );
}
