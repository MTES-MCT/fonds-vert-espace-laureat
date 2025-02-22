import React from "react";

import { InformationFinanciere } from "@/services/fondsvert/dossier";

export function InformationFinanciereTimeline({
  informationFinanciere,
}: {
  informationFinanciere: InformationFinanciere;
}) {
  return (
    <div>
      <p>
        <strong>Centre financier CHORUS:</strong>{" "}
        {informationFinanciere.centre_financier_chorus}
      </p>
      {informationFinanciere.informations_engagement.map((info, index) => (
        <div key={index} className="border-t pt-2 mt-2">
          <h3 className="text-lg font-bold">
            Année: {info.annee_information_financiere}
          </h3>
          {info.engagements_juridiques.map((eng, i) => (
            <div key={i} className="ml-4 mt-2">
              <p>
                <strong>Numéro EJ:</strong> {eng.numero_ej}
              </p>
              <p>
                <strong>Nom démarche:</strong> {eng.nom_demarche}
              </p>
              <p>
                <strong>Nom axe:</strong> {eng.nom_axe}
              </p>
              <p>
                <strong>Montant engagé:</strong> {eng.montant_engage}
              </p>
              <p>
                <strong>Montant engagé initial:</strong>{" "}
                {eng.montant_engage_initial}
              </p>
              {eng.demandes_paiement.length > 0 && (
                <div className="ml-4">
                  <h4 className="font-semibold">Demandes de paiement</h4>
                  {eng.demandes_paiement.map((dp, j) => (
                    <div key={j} className="ml-4">
                      <p>
                        <strong>Numéro DP:</strong> {dp.numero_dp}
                      </p>
                      <p>
                        <strong>Date DP:</strong>{" "}
                        {new Date(dp.date_dp).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Montant payé:</strong> {dp.montant_paye}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
