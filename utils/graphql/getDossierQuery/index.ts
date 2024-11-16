import { graphql } from "@/generated";

export const getDossierQuery = graphql(`
  query getDossier($number: Int!) {
    dossier(number: $number) {
      id
      number
      state
      dateTraitement
      demandeur {
        __typename
        ...PersonneMoraleFragment
      }
      demarche {
        title
      }
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

  fragment PersonneMoraleFragment on PersonneMorale {
    siret
    libelleNaf
  }
`);
