import { requireEnv } from "@/utils/env";

const [baseUrl] = requireEnv("NEXT_PUBLIC_BASE_URL");

export const buildUrl = (path: string): URL => {
  return new URL(path, baseUrl);
};

export const welcomeUrl = buildUrl("/");

export const dashboardUrl = buildUrl("/projets");

export const errorUrl = buildUrl("/connexion/echec");
