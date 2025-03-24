import { loadEnvConfig } from "@next/env";
import { sealData } from "iron-session";
import { SessionOptions } from "iron-session";
import { Page } from "next/experimental/testmode/playwright/msw";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const mockUser = {
  id: "test-user-id",
  isProConnectIdentityProvider: true,
  email: "alice.doe@example.com",
  isSiretVerifiedForEmailDomain: true,
  siret: "12345678910111",
};

interface SessionData {
  user: typeof mockUser;
}

const getSessionOptions = (): SessionOptions => {
  const password = process.env.IRON_SESSION_PWD || "";

  return {
    password,
    cookieName: "fonds-vert-espace-laureat",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
    ttl: 12 * 60 * 60,
  };
};

async function createAuthCookie(): Promise<{
  name: string;
  value: string;
}> {
  const options = getSessionOptions();

  const sessionData: SessionData = {
    user: mockUser,
  };

  const seal = await sealData(sessionData, {
    password: options.password,
    ttl: options.ttl,
  });

  return {
    name: options.cookieName,
    value: seal,
  };
}

export async function authenticatePage(page: Page): Promise<void> {
  const cookie = await createAuthCookie();

  await page.context().addCookies([
    {
      name: cookie.name,
      value: cookie.value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
