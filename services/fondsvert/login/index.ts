import { URLSearchParams } from "url";

import { defaultHeaders, error } from "@/services/fondsvert/helpers";
import { requireEnv } from "@/utils/env";
import { logException } from "@/utils/error";

export async function login() {
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
      return error(`Erreur d'authentification : ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    if (!token) {
      return error("Aucun jeton d'accès n'a été reçu");
    }

    return token;
  } catch (e) {
    logException(e);
    return error("Une erreur imprévue est survenue");
  }
}
