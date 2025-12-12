import { URLSearchParams } from "url";

import { defaultHeaders } from "@/services/fondsvert/helpers";
import { requireEnv } from "@/utils/env";
import { logException } from "@/utils/error";
import { createTokenCache } from "@/utils/token-cache";

const TOKEN_TTL_MS = 5 * 60 * 1000;

async function fetchToken(): Promise<string | undefined> {
  const [endpoint, username, password] = requireEnv(
    "FONDSVERT_API_ENDPOINT",
    "FONDSVERT_API_USERNAME",
    "FONDSVERT_API_PASSWORD",
  );

  try {
    const loginResponse = await fetch(new URL("/fonds_vert/login", endpoint), {
      method: "POST",
      headers: {
        ...defaultHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    });

    if (!loginResponse.ok) {
      console.error(
        `Impossible de s'authentifier sur l'API Fonds Vert (${loginResponse.statusText})`,
      );
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    if (!token) {
      console.error("Aucun jeton d'accès n'a été reçu de l'API Fonds Vert");
      return;
    }

    return token;
  } catch (e) {
    logException(e);
    console.error("Une erreur imprévue est survenue sur l'API Fonds Vert");
    return;
  }
}

export const login = createTokenCache(fetchToken, TOKEN_TTL_MS);
