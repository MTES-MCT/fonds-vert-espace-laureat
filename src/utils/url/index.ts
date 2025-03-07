import { requireEnv } from "@/utils/env";

const [baseUrl] = requireEnv("NEXT_PUBLIC_BASE_URL");

export const welcomeUrl = new URL("/", baseUrl);

export const dashboardUrl = new URL("/espace-laureat", baseUrl);

export const errorUrl = new URL("/connexion/echec", baseUrl).toString();
