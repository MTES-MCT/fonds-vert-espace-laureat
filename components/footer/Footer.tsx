"use client";

import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

export const Footer = () => (
  <DsfrFooter
    accessibility="non compliant"
    className="bg-white"
    contentDescription={"Fonds vert / Espace lauréat"}
    bottomItems={[headerFooterDisplayItem]}
  />
);
