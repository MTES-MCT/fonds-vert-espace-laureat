import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";

export function Navigation() {
  const segment = useSelectedLayoutSegment();
  const demo = /^\/projets\/demo(?:\/|$)/.test(usePathname());

  return (
    <MainNavigation
      items={[
        {
          text: "Accueil",
          linkProps: {
            href: "/",
          },
          isActive: segment === null,
        },
        {
          text: "Projets",
          linkProps: {
            href: "/projets",
          },
          isActive:
            !demo &&
            segment !== null &&
            ["projets", "connexion"].includes(segment),
        },
      ]}
    />
  );
}
