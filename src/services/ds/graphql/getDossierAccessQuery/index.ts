import { graphql } from "@/generated";

export const getDossierAccessQuery = graphql(`
  query getDossierAccess($number: Int!) {
    dossier(number: $number) {
      demandeur {
        __typename
      }
      usager {
        email
      }
      groupeInstructeur {
        instructeurs {
          email
        }
      }
    }
  }
`);
