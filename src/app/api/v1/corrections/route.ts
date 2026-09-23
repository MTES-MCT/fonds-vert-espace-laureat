import { correctionError, getCorrections } from "@/api/corrections-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = getCorrections;

function methodNotAllowed() {
  return correctionError(405, "method_not_allowed", { Allow: "GET" });
}

// Explicit HEAD prevents Next.js from invoking GET and creating an export.
export const HEAD = methodNotAllowed;
export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
