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
    return <>Aucune commune pour ce département</>;
  }

  return (
    <div className="mb-12">
      <label htmlFor="commune-select" className="block mb-2 font-medium">
        Filtrer sur une commune :
      </label>
      <select
        id="commune-select"
        className="fr-select w-full max-w-xs"
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
    </div>
  );
}
