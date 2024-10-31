import "./globals.css";

import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { ReactElement } from "react";

import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { DsfrHead } from "@/components/dsfr/DsfrHead";
import { StartDsfr } from "@/components/dsfr/StartDsfr";
import { Header } from "@/components/header/Header";

export default function RootLayout({ children }: { children: ReactElement }) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        <StartDsfr />
        <DsfrHead />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <Header />
          {children}
        </DsfrProvider>
      </body>
    </html>
  );
}
