import { login } from "@/services/fondsvert/login";
import { requireEnv } from "@/utils/env";
import { logException } from "@/utils/error";

const [endpoint] = requireEnv("FONDSVERT_API_ENDPOINT");

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

    if ([503, 422, 404].includes(dossiersResponse.status)) {
      return { success: false, status: dossiersResponse.status };
    }

    if (!dossiersResponse.ok) {
      return { success: false, status: dossiersResponse.status };
    }

    return { success: true, data: await dossiersResponse.json() };
  } catch (e) {
    logException(e);
    return { success: false, status: 500 };
  }
}
