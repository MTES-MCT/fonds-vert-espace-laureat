const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const welcomeUrl = new URL("/", baseUrl);

export const errorUrl = new URL("/connexion/echec", baseUrl).toString();
