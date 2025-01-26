import { Impact } from "@/utils/demarches/impact";
import { getChamps } from "@/utils/demarches/impact/champs";
import { logException } from "@/utils/error";
import { createGraphqlClient } from "@/utils/graphql";
import { getDemarcheDossiersQuery } from "@/utils/graphql/getDemarcheDossiersQuery";
import { isAdmin } from "@/utils/roles";

const graphqlClient = createGraphqlClient();

export async function getDemarcheDossiers({
  demarcheNumber,
  userEmail,
}: {
  demarcheNumber: number;
  userEmail: string;
}): Promise<
  { success: true; data: Impact[] } | { success: false; error: string }
> {
  try {
    const { demarche } = await graphqlClient.request(getDemarcheDossiersQuery, {
      demarcheNumber,
    });

    const nodes = demarche.dossiers.nodes ?? [];

    const dossiers = nodes
      .filter((dossier) => dossier !== null)
      .filter((dossier) =>
        !isAdmin ? dossier.usager.email === userEmail : true,
      )
      .map((dossier) => ({
        numero: dossier.number,
        dateTraitement: dossier.dateTraitement,
        state: dossier.state,
        demandeur: {
          email: dossier.usager.email,
        },
        champs: getChamps(dossier.champs),
      })) as Impact[];

    return {
      success: true,
      data: dossiers,
    };
  } catch (error: unknown) {
    logException(error);
    return {
      success: false,
      error:
        "Une erreur est survenue. Veuillez nous contacter si le problème persiste.",
    };
  }
}
