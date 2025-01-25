import { graphql } from "@/generated";

export const getDemarcheDossiersQuery = graphql(`
  query getDemarcheDossiers($demarcheNumber: Int!) {
    demarche(number: $demarcheNumber) {
      dossiers {
        nodes {
          ...DossierFragment
        }
      }
    }
  }

  fragment DossierFragment on Dossier {
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
      ...RootChampFragment
    }
  }

  fragment ChampFragment on Champ {
    __typename
    champDescriptorId
    stringValue
    ... on DecimalNumberChamp {
      decimalNumber: value
    }
    ... on DateChamp {
      date
    }
  }

  fragment RootChampFragment on Champ {
    __typename
    champDescriptorId
    ... on RepetitionChamp {
      rows {
        champs {
          ...ChampFragment
        }
      }
    }
  }
`);
