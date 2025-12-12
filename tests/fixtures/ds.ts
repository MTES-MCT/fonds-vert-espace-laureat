import {
  AGENCE_EAU_NUMBER,
  CONTACT_EMAIL,
  DEPARTMENT,
  DOSSIER_NUMBER,
  LEGAL_REPRESENTATIVE_EMAIL,
  PROGRAM_TITLE,
  PROJECT_SUMMARY,
  PROJECT_TITLE,
} from "./constants";

const dossier = {
  id: "ABCDEFGHg==",
  number: DOSSIER_NUMBER,
  state: "accepte",
  dateTraitement: "2024-02-11T10:46:18+01:00",
  demandeur: {
    __typename: "PersonneMorale",
    siret: "12345678910111",
    libelleNaf: "Administration publique générale",
  },
  demarche: {
    title: `FONDS VERT - ${PROGRAM_TITLE}`,
  },
  usager: {
    email: LEGAL_REPRESENTATIVE_EMAIL,
  },
  groupeInstructeur: {
    instructeurs: [
      {
        email: "autre-instructeur@example.com",
      },
    ],
  },
  annotations: [
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ3OQ==",
      stringValue: "",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMzAyMDUxMw==",
      stringValue: "",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMzAyMDUxNA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAyMDUxNQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ3OA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5NDA5OA==",
      stringValue: "",
    },
    {
      __typename: "RepetitionChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ4MA==",
      stringValue: "",
      rows: [
        {
          champs: [
            {
              __typename: "TextChamp",
              champDescriptorId: "Q2hhbXAtMjk4MjQ4MQ==",
              stringValue: "",
            },
            {
              __typename: "TextChamp",
              champDescriptorId: "Q2hhbXAtMzAyMDUxOA==",
              stringValue: "",
            },
            {
              __typename: "TextChamp",
              champDescriptorId: "Q2hhbXAtMjk5Njg4OA==",
              stringValue: "",
            },
            {
              __typename: "TextChamp",
              champDescriptorId: "Q2hhbXAtMjk5Njg4Ng==",
              stringValue: "",
            },
            {
              __typename: "CheckboxChamp",
              champDescriptorId: "Q2hhbXAtMzAyMDUxNw==",
              stringValue: "",
            },
            {
              __typename: "TextChamp",
              champDescriptorId: "Q2hhbXAtMjk4MjQ4Mw==",
              stringValue: "",
            },
            {
              __typename: "TextChamp",
              champDescriptorId: "Q2hhbXAtMjk4MjQ4NA==",
              stringValue: "",
            },
            {
              __typename: "DateChamp",
              champDescriptorId: "Q2hhbXAtMjk4MjQ4NQ==",
              stringValue: "",
              date: null,
            },
            {
              __typename: "PieceJustificativeChamp",
              champDescriptorId: "Q2hhbXAtMjk4MjUxMg==",
              stringValue: "",
            },
            {
              __typename: "PieceJustificativeChamp",
              champDescriptorId: "Q2hhbXAtMzExMTU5Nw==",
              stringValue: "",
            },
          ],
        },
      ],
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ4Nw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ4OA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5MQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Njg4NA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Njg4NQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5Mg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5Mw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk3NjEzMQ==",
      stringValue: "",
    },
    {
      __typename: "DateChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5NA==",
      stringValue: "",
      date: null,
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMTk5MDI2Ng==",
      stringValue: "10073564",
      decimalNumber: 10073564,
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjUwMA==",
      stringValue: "",
      decimalNumber: null,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5Ng==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5Nw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5OA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk3NjEzMA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzEzNjg2Mw==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzEzNjg0Nw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjQ5OQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjUwMw==",
      stringValue: "",
    },
    {
      __typename: "EngagementJuridiqueChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjUwMQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk4MjUwNg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAxOTI0MQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAxOTI0Mg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAxOTI0NA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAyNTQ3NQ==",
      stringValue: AGENCE_EAU_NUMBER,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAxOTI0Mw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk3NjEzMw==",
      stringValue: "",
    },
  ],
  champs: [
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzMzk3NQ==",
      stringValue: "Par Conseil SAS (site, webinaire, démonstration, etc)",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Njg5OA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtODgwNDAy",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTQ0Ng==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwMzc4Nw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMTk3NzQ0NQ==",
      stringValue: "Collectivité à statut particulier",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAxOTQ0MQ==",
      stringValue: "Collectivité à statut particulier",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg0MA==",
      stringValue: "false",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTM2Mg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDM2MA==",
      stringValue: "Dago",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDM2Mg==",
      stringValue: "Marie",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDM2NA==",
      stringValue: "Maire de Nantes",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc1Mw==",
      stringValue: LEGAL_REPRESENTATIVE_EMAIL,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc1NA==",
      stringValue: "",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTQxNQ==",
      stringValue: "false",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc1Ng==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMTUwNjQwMQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDM5MQ==",
      stringValue: "DOE",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDM5Mw==",
      stringValue: "Alice",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDM5NA==",
      stringValue: "Cheffe du service",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDQwMA==",
      stringValue: CONTACT_EMAIL,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjkzNDQwMQ==",
      stringValue: "01 02 03 04 05",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk3MTQxNw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg0Mg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk3MTQ0NA==",
      stringValue: PROJECT_TITLE,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg3Mw==",
      stringValue: PROJECT_SUMMARY,
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg2Mw==",
      stringValue: null,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc1Nw==",
      stringValue: "",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc1OQ==",
      stringValue: "Atténuation (émissions et efficacité énergétique)",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAyMDQ5NQ==",
      stringValue:
        "La Ville de Nantes s'est engagée dans un projet global de rénovation.",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk3MTQ0Mw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAwMDE2NA==",
      stringValue: "Métropole",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzM0ODkyMw==",
      stringValue: DEPARTMENT,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNjc5OQ==",
      stringValue: DEPARTMENT,
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc2MA==",
      stringValue: "true",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAyMDUwMA==",
      stringValue: "31 Rue du Paris 44000 Nantes",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTQyMw==",
      stringValue: "",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc2NQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTQ1Ng==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc4NQ==",
      stringValue: "Opération de rénovation",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg3NA==",
      stringValue: "false",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1Mw==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTcxMA==",
      stringValue: "",
    },
    {
      __typename: "DateChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTcxMg==",
      stringValue: "12 avril 2022",
      date: "2022-04-12",
    },
    {
      __typename: "DateChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTcxNA==",
      stringValue: "31 décembre 2026",
      date: "2026-12-31",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NjIyNQ==",
      stringValue: "Echanges préalables avec les architectes",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTQzOA==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzAyMDQ5Ng==",
      stringValue: null,
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk0NzQzNw==",
      stringValue: "20839102.43",
      decimalNumber: 20839102.43,
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk3NzM3NQ==",
      stringValue: "3511822.49",
      decimalNumber: 3511822.49,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5MTQ5MA==",
      stringValue: "",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzg2NTAxNA==",
      stringValue: "false",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc3MQ==",
      stringValue: "false",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc3OA==",
      stringValue: "false",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1MQ==",
      stringValue: "",
    },
    {
      __typename: "IntegerNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg2Mg==",
      stringValue: "1",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg2MQ==",
      stringValue: "Équipement sportif",
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1OQ==",
      stringValue: "3968",
      decimalNumber: 3968,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1OA==",
      stringValue: "surface de plancher",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzg4Mjk0Mg==",
      stringValue: "false",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc4Nw==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMjk3NzYxMA==",
      stringValue: null,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc4OA==",
      stringValue: "",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg3MA==",
      stringValue: "Travaux d'isolation de l'enveloppe du bâtiments",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg2OA==",
      stringValue: "Peinture et reprise du carrelage",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc4OQ==",
      stringValue: "Changement du système de chauffage.",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1NQ==",
      stringValue: "Chauffage urbain et électrique",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1NA==",
      stringValue: "Chauffage urbain et électrique",
    },
    {
      __typename: "MultipleDropDownListChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc5MA==",
      stringValue: "Isolation des murs.",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc5Mg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgzMTU5Mw==",
      stringValue: "",
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg1MA==",
      stringValue: "2055650",
      decimalNumber: 2055650,
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg0OQ==",
      stringValue: "12345",
      decimalNumber: 12345,
    },
    {
      __typename: "IntegerNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg0OA==",
      stringValue: "40",
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg3NQ==",
      stringValue: "348",
      decimalNumber: 348,
    },
    {
      __typename: "DecimalNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg0Nw==",
      stringValue: "212",
      decimalNumber: 212,
    },
    {
      __typename: "IntegerNumberChamp",
      champDescriptorId: "Q2hhbXAtMjk5Nzg0Ng==",
      stringValue: "39",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NjIyNA==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzAxMDUzNQ==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc5Ng==",
      stringValue: null,
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTc5OQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NTQzNw==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwMA==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwMg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NzQzOQ==",
      stringValue: "",
    },
    {
      __typename: "PieceJustificativeChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwMw==",
      stringValue: null,
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzExODQ5Nw==",
      stringValue: "",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgxMA==",
      stringValue: "true",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwOQ==",
      stringValue: "true",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwOA==",
      stringValue: "true",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwNw==",
      stringValue: "true",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwNg==",
      stringValue: "true",
    },
    {
      __typename: "CheckboxChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgwNQ==",
      stringValue: "true",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NjAyNg==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMzgwNTgxMQ==",
      stringValue: "",
    },
    {
      __typename: "TextChamp",
      champDescriptorId: "Q2hhbXAtMjk0NzUwMA==",
      stringValue: "",
    },
  ],
};

export const getDossierData = { data: { dossier } };

export const makeDossierDataForInstructeur = (
  dossierNumber: number,
  instructeurEmail: string,
) => ({
  data: {
    dossier: {
      ...dossier,
      number: dossierNumber,
      groupeInstructeur: {
        instructeurs: [{ email: instructeurEmail }],
      },
    },
  },
});

export const makeDossierDataWithTitle = (title: string) => ({
  data: {
    dossier: {
      ...dossier,
      champs: dossier.champs.map((champ) =>
        champ.champDescriptorId === "Q2hhbXAtMjk3MTQ0NA=="
          ? { ...champ, stringValue: title }
          : champ,
      ),
    },
  },
});

export const getDemarcheDossiersData = {
  data: {
    demarche: {
      dossiers: {
        nodes: [],
      },
    },
  },
};
