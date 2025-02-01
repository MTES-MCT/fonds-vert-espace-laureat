import { requireEnv } from "@/utils/env";
import { logException } from "@/utils/error";
import { login } from "@/utils/fondsvert/login";

const [endpoint] = requireEnv("FONDSVERT_API_ENDPOINT");

export function error(message: string) {
  console.error(message);
  return [];
}

export function defaultHeaders({ token }: { token?: string } = {}) {
  return {
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "Bearer",
  };
}

export async function fetchFondsVert<T>(
  path: string,
): Promise<{ success: true; data: T } | { success: false; status: number }> {
  try {
    const token = await login();
    const dossiersResponse = await fetch(
      new URL(`/fonds_vert/${path}`, endpoint),
      {
        method: "GET",
        headers: {
          ...defaultHeaders({ token }),
        },
      },
    );

    if (dossiersResponse.status === 422) {
      return { success: false, status: 422 };
    }

    if (dossiersResponse.status === 404) {
      error("Ressource introuvable");
      return { success: false, status: 404 };
    }

    if (!dossiersResponse.ok) {
      error(dossiersResponse.statusText);
      return { success: false, status: dossiersResponse.status };
    }

    return { success: true, data: await dossiersResponse.json() };
  } catch (e) {
    logException(e);
    return { success: false, status: 500 };
  }
}
