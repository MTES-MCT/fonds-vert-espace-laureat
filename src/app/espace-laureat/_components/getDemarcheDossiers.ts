import { createGraphqlClient } from "@/services/ds/graphql";
import { getDemarcheDossiersQuery } from "@/services/ds/graphql/getDemarcheDossiersQuery";
import { Impact } from "@/services/ds/impact";
import { getChamps } from "@/services/ds/impact/champs";
import { MAX_IMPACT_AGE_MS } from "@/services/ds/impact/selectRecentImpact";
import { logException } from "@/utils/error";
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
    const createdSince = new Date(Date.now() - MAX_IMPACT_AGE_MS).toISOString();
    const { demarche } = await graphqlClient.request(getDemarcheDossiersQuery, {
      demarcheNumber,
      createdSince,
    });

    const nodes = demarche.dossiers.nodes ?? [];

    const dossiers = nodes
      .filter((dossier) => dossier !== null)
      .filter(
        (dossier) =>
          isAdmin({ userEmail }) || dossier.usager.email === userEmail,
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
