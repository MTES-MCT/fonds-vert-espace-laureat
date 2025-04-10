import "./globals.css";

import { HeaderQuickAccessItem } from "@codegouvfr/react-dsfr/Header";
import { createGetHtmlAttributes } from "@codegouvfr/react-dsfr/next-app-router/getHtmlAttributes";
import { ReactElement } from "react";

import { DsfrProvider } from "@/components/dsfr";
import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { DsfrHead } from "@/components/dsfr/DsfrHead";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { getSession } from "@/utils/session";

export default async function RootLayout({
  children,
}: {
  children: ReactElement;
}) {
  const lang = "fr";
  const { getHtmlAttributes } = createGetHtmlAttributes({
    defaultColorScheme,
  });
  const session = await getSession();
  const user = session?.user;

  const quickAccessItems = user
    ? [
        <div key={0} className="sm:flex items-center gap-x-2 mb-4">
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
          <main className="fr-container my-8 min-h-80">{children}</main>
          <Footer />
        </DsfrProvider>
      </body>
    </html>
  );
}
