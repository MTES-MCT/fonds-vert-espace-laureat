import { login } from "@/services/fondsvert/login";
import { requireEnv } from "@/utils/env";
import { logException } from "@/utils/error";

export const FONDS_VERT_TIMEOUT_MS = 10_000;

export function defaultHeaders({ token }: { token?: string } = {}) {
  return {
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "Bearer",
  };
}

export async function fetchFondsVert<T>(
  path: string,
): Promise<
  | { success: true; data: T }
  | { success: false; status: number; statusText: string }
> {
  try {
    const [endpoint] = requireEnv("FONDSVERT_API_ENDPOINT");
    const token = await login();
    if (!token)
      return {
        success: false,
        status: 401,
        statusText: "Authentication unavailable",
      };
    const url = new URL(`/fonds_vert/${path}`, endpoint);

    const dossiersResponse = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(FONDS_VERT_TIMEOUT_MS),
      redirect: "error",
      headers: {
        ...defaultHeaders({ token }),
      },
    });

    if (!dossiersResponse.ok) {
      return {
        success: false,
        status: dossiersResponse.status,
        statusText: dossiersResponse.statusText,
      };
    }

    return { success: true, data: await dossiersResponse.json() };
  } catch (e) {
    logException(e);
    return { success: false, status: 500, statusText: "" };
  }
}
