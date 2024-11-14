import { graphql } from "@/generated";

export const getDossierQuery = graphql(`
  query getDossier($number: Int!) {
    dossier(number: $number) {
      id
      number
      state
      dateTraitement
      usager {
        email
      }
      annotations {
        ...ChampFragment
      }
      champs {
        ...ChampFragment
      }
    }
  }

  fragment ChampFragment on Champ {
    __typename
    champDescriptorId
    stringValue
    ... on DecimalNumberChamp {
      decimalNumber: value
    }
  }
`);
