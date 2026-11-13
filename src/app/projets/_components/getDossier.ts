import { ClientError } from "graphql-request";

import type { GetDossierAccessQuery } from "@/generated/graphql";
import { createGraphqlClient } from "@/services/ds/graphql";
import { getDossierAccessQuery } from "@/services/ds/graphql/getDossierAccessQuery";
import { getDossierQuery } from "@/services/ds/graphql/getDossierQuery";
import { Dossier } from "@/services/ds/subvention";
import { getChamps } from "@/services/ds/subvention/champs";
import { isReservedDemoDossier } from "@/utils/demo/reservation";
import { logException } from "@/utils/error";
import { isAdmin } from "@/utils/roles";

function canAccessDossier({
  dossier,
  userEmail,
}: {
  dossier: GetDossierAccessQuery["dossier"];
  userEmail: string;
}) {
  if (dossier.demandeur.__typename !== "PersonneMorale") {
    return false;
  }

  return (
    dossier.usager.email === userEmail ||
    dossier.groupeInstructeur.instructeurs.some(
      (instructeur) => instructeur.email === userEmail,
    ) ||
    isAdmin({ userEmail })
  );
}

export async function getDossierAccess({
  numeroDossier,
  userEmail,
}: {
  numeroDossier: number;
  userEmail: string;
}): Promise<boolean> {
  if (isReservedDemoDossier(numeroDossier)) return false;
  try {
    const graphqlClient = createGraphqlClient();
    const { dossier } = await graphqlClient.request(getDossierAccessQuery, {
      number: numeroDossier,
    });

    return canAccessDossier({ dossier, userEmail });
  } catch (error: unknown) {
    logException(error);
    return false;
  }
}

export async function getDossier({
  numeroDossier,
  userEmail,
}: {
  numeroDossier: number;
  userEmail: string;
}): Promise<
  | { success: true; data: Dossier }
  | { success: false; reason: "denied" | "unavailable" }
> {
  if (isReservedDemoDossier(numeroDossier)) {
    return { success: false, reason: "denied" };
  }
  try {
    const graphqlClient = createGraphqlClient();
    const { dossier } = await graphqlClient.request(getDossierQuery, {
      number: numeroDossier,
    });

    if (
      !dossier ||
      dossier.demandeur.__typename !== "PersonneMorale" ||
      !canAccessDossier({ dossier, userEmail })
    ) {
      return { success: false, reason: "denied" };
    }

    return {
      success: true,
      data: {
        viewerRelationship:
          dossier.usager.email === userEmail
            ? "porteur"
            : dossier.groupeInstructeur.instructeurs.some(
                  (instructeur) => instructeur.email === userEmail,
                )
              ? "instructeur"
              : undefined,
        numero: dossier.number,
        demandeur: {
          siret: dossier.demandeur.siret,
        },
        demarche: {
          title: dossier.demarche.title,
        },
        champs: getChamps([...dossier.annotations, ...dossier.champs]),
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof ClientError &&
      error.response.status === 200 &&
      error.response.errors?.length === 1 &&
      error.response.errors[0].path?.length === 1 &&
      error.response.errors[0].path[0] === "dossier" &&
      error.response.errors[0].extensions?.code === "not_found"
    ) {
      return { success: false, reason: "denied" };
    }
    logException(error);
    return { success: false, reason: "unavailable" };
  }
}
