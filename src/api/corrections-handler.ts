import { correctionAccess } from "@/api/corrections-access";
import type { components } from "@/api/generated/corrections-api";
import {
  CORRECTION_EXPORT_INTERVAL_SECONDS,
  CorrectionExportBusyError,
  createAdmittedCorrectionExport,
} from "@/db/fondsVertCorrectionAdmission";
import {
  FondsVertExportPageError,
  MAX_EXPORT_PAGE_SIZE,
  readFondsVertCorrectionExportPage,
  readFondsVertCorrectionExportPageSize,
} from "@/db/fondsVertCorrectionExport";

type ApiError = components["schemas"]["ApiError"];
type CorrectionPage = components["schemas"]["CorrectionPage"];
const cursorPattern =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(0|[1-9][0-9]{0,9})$/;

export function correctionError(
  status: number,
  error: ApiError["error"],
  headers?: HeadersInit,
) {
  const body: ApiError = { error };
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function getCorrections(request: Request) {
  const access = correctionAccess(request);
  if (access) {
    return correctionError(
      access,
      access === 503
        ? "unavailable"
        : access === 401
          ? "unauthorized"
          : "forbidden",
      access === 401 ? { "WWW-Authenticate": "Bearer" } : undefined,
    );
  }
  const params = new URL(request.url).searchParams;
  if (
    [...params.keys()].some((key) => key !== "cursor" && key !== "page_size") ||
    params.getAll("cursor").length > 1 ||
    params.getAll("page_size").length > 1 ||
    (params.has("cursor") && params.has("page_size"))
  ) {
    return correctionError(400, "invalid_request");
  }
  const cursor = params.get("cursor");
  const parsed = cursor === null ? null : cursorPattern.exec(cursor);
  const size = params.get("page_size") ?? "100";
  if (
    (cursor !== null &&
      (!parsed || cursor.length > 64 || Number(parsed[2]) > 2_147_483_647)) ||
    !/^[1-9][0-9]{0,3}$/.test(size) ||
    Number(size) > MAX_EXPORT_PAGE_SIZE
  ) {
    return correctionError(400, "invalid_request");
  }

  try {
    const exportId = parsed
      ? parsed[1]
      : (await createAdmittedCorrectionExport(Number(size))).exportId;
    const pageNumber = parsed ? Number(parsed[2]) : 0;
    const page = await readFondsVertCorrectionExportPage(exportId, pageNumber);
    // Page zero retains the original size. A missing successor is an error on
    // continuation, never evidence that a partial export has reached its end.
    const pageSize =
      pageNumber === 0
        ? page.corrections.length
        : await readFondsVertCorrectionExportPageSize(exportId);
    const nextCursor =
      (pageNumber + 1) * pageSize < page.totalCount
        ? `${exportId}:${pageNumber + 1}`
        : null;
    const body: CorrectionPage = {
      corrections: page.corrections.map((correction) => ({
        dossier_number: correction.dossierNumber,
        champ: correction.metricCode,
        valeur_corrigee: correction.value,
        date_correction: correction.correctedAt,
      })),
      next_cursor: nextCursor,
      generated_at: page.generatedAt.toISOString(),
      expires_at: page.expiresAt.toISOString(),
      total_count: page.totalCount,
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CorrectionExportBusyError) {
      return correctionError(429, "rate_limited", {
        "Retry-After": String(CORRECTION_EXPORT_INTERVAL_SECONDS),
      });
    }
    if (error instanceof FondsVertExportPageError) {
      return correctionError(error.code === "expired" ? 410 : 404, error.code);
    }
    return correctionError(503, "unavailable");
  }
}
