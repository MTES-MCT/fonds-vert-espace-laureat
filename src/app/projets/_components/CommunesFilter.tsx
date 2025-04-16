"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent } from "react";

export function CommunesFilter({
  communes,
  codeDepartement,
  codeCommune,
}: {
  communes: { code: string; nom: string }[];
  codeDepartement: string;
  codeCommune?: string;
}) {
  const router = useRouter();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCommune = event.target.value;
    if (selectedCommune) {
      router.push(`/projets/${codeDepartement}?commune=${selectedCommune}`);
    } else {
      router.push(`/projets/${codeDepartement}`);
    }
  };

  if (!communes) {
    return null;
  }

  return (
    <div className="mb-10">
      <label htmlFor="commune-select" className="mb-2 block font-medium">
        Filtrer sur une commune :
      </label>
      <div className="flex flex-wrap items-center gap-x-4">
        <select
          id="commune-select"
          className="fr-select mb-0 w-full max-w-xs"
          onChange={handleChange}
          value={codeCommune || ""}
        >
          <option value="">-- Toutes les communes --</option>
          {communes.map((commune) => (
            <option key={commune.code} value={commune.code}>
              {commune.nom}
            </option>
          ))}
        </select>
        {codeCommune && (
          <a className="fr-link block" href={`/projets/${codeDepartement}`}>
            Réinitialiser
          </a>
        )}
      </div>
    </div>
  );
}
