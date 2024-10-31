"use client";

import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { Footer as DsfrFooter } from "@codegouvfr/react-dsfr/Footer";

export const Footer = () => (
  <DsfrFooter
    accessibility="non compliant"
    contentDescription={"Fonds vert / Espace bénéficiaire"}
    bottomItems={[headerFooterDisplayItem]}
  />
);
