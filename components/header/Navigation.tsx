import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import { useSelectedLayoutSegment } from "next/navigation";

export function Navigation() {
  const segment = useSelectedLayoutSegment();

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
          text: "Espace lauréat",
          linkProps: {
            href: "/espace-laureat",
          },
          isActive: segment === "espace-laureat",
        },
      ]}
    />
  );
}
