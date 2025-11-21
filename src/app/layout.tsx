import "./globals.css";

import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { createGetHtmlAttributes } from "@codegouvfr/react-dsfr/next-app-router/getHtmlAttributes";

import { DsfrProvider } from "@/components/dsfr";
import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { DsfrHead } from "@/components/dsfr/DsfrHead";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { getSession } from "@/utils/session";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = "fr";
  const { getHtmlAttributes } = createGetHtmlAttributes({
    defaultColorScheme,
  });
  const session = await getSession();
  const user = session?.user;

  const quickAccessItems = user
    ? [
        <div key={0} className="mb-4 items-center gap-x-2 sm:flex">
          <div className="text-sm font-medium">{user.email}</div>
          <HeaderQuickAccessItem
            quickAccessItem={{
              iconId: "fr-icon-logout-box-r-line",
              text: "Se déconnecter",
              linkProps: {
                className: "mb-0",
                href: "/api/auth/proconnect/logout",
              },
            }}
          />
        </div>,
      ]
    : [
        <HeaderQuickAccessItem
          key={0}
          quickAccessItem={{
            iconId: "ri-account-box-line",
            text: "Espace lauréat",
            linkProps: { href: "/espace-laureat" },
          }}
        />,
      ];

  return (
    <html {...getHtmlAttributes({ lang })}>
      <head>
        <DsfrHead />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <Header quickAccessItems={quickAccessItems} />
          <main className="min-h-80">{children}</main>
          <Footer />
        </DsfrProvider>
      </body>
    </html>
  );
}
