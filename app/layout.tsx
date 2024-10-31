import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import Link from "next/link";
import { ReactElement } from "react";

import { defaultColorScheme } from "@/components/dsfr/defaultColorScheme";
import { StartDsfr } from "@/components/dsfr/StartDsfr";

export default function RootLayout({ children }: { children: ReactElement }) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        <StartDsfr />
        <DsfrHead
          Link={Link}
          preloadFonts={[
            "Marianne-Regular",
            "Marianne-Medium",
            "Marianne-Bold",
          ]}
        />
      </head>
      <body>
        <DsfrProvider lang={lang}>{children}</DsfrProvider>
      </body>
    </html>
  );
}
