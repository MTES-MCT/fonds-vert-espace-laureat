import { graphql } from "@/generated";

export const getDemarcheDossiersQuery = graphql(`
  query getDemarcheDossiers($demarcheNumber: Int!) {
    demarche(number: $demarcheNumber) {
      dossiers {
        nodes {
          ...NodeFragment
        }
      }
    }
  }

  fragment NodeFragment on Dossier {
    __typename
    id
    number
    dateTraitement
    state
    usager {
      email
    }
    champs {
      ...ChampFragment
    }
  }

  fragment ChampFragment on Champ {
    __typename
    champDescriptorId
    stringValue
    updatedAt
    ... on DecimalNumberChamp {
      decimalNumber: value
    }
    ... on DateChamp {
      date
    }
  }
`);
