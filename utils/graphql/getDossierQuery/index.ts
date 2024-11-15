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
        ...RootChampFragment
      }
      champs {
        ...ChampFragment
        ...RootChampFragment
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
