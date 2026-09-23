import { createHash, timingSafeEqual } from "node:crypto";
import { BlockList, isIP } from "node:net";

const secretPattern = /^[A-Za-z0-9_-]{43,128}$/;

function equalSecret(received: string, expected: string) {
  return timingSafeEqual(
    createHash("sha256").update(received).digest(),
    createHash("sha256").update(expected).digest(),
  );
}

/** Trust only metadata overwritten by an authenticated, verified ingress. */
export function correctionAccess(request: Request): 401 | 403 | 503 | null {
  const key = process.env.CORRECTIONS_API_KEY ?? "";
  const previous = process.env.CORRECTIONS_API_PREVIOUS_KEY;
  const ingress = process.env.CORRECTIONS_INGRESS_SECRET ?? "";
  const addresses = (process.env.CORRECTIONS_ALLOWED_IPS ?? "").split(",");
  if (
    process.env.CORRECTIONS_API_ENABLED !== "true" ||
    process.env.CORRECTIONS_INGRESS_VERIFIED !== "true" ||
    !secretPattern.test(key) ||
    !secretPattern.test(ingress) ||
    ingress === key ||
    (previous !== undefined &&
      (!secretPattern.test(previous) || previous === ingress)) ||
    addresses.some((ip) => !isIP(ip) || ip.includes("%"))
  ) {
    return 503;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{43,128})$/i.exec(authorization);
  if (!match) return 401;
  const currentMatches = equalSecret(match[1], key);
  const previousMatches = equalSecret(match[1], previous ?? key);
  if (!currentMatches && !previousMatches) return 401;

  const attestation = request.headers.get("x-corrections-ingress") ?? "";
  if (
    attestation.length > 128 ||
    !equalSecret(attestation, ingress) ||
    request.headers.get("x-corrections-proto") !== "https"
  ) {
    return 403;
  }
  const ip = request.headers.get("x-corrections-client-ip") ?? "";
  const family = isIP(ip);
  if (!family || ip.includes("%")) return 403;
  const allowlist = new BlockList();
  for (const address of addresses) {
    allowlist.addAddress(address, isIP(address) === 4 ? "ipv4" : "ipv6");
  }
  return allowlist.check(ip, family === 4 ? "ipv4" : "ipv6") ? null : 403;
}
