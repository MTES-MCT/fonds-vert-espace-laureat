const descriptorIds = {
  numeroDossierSubvention: ["Q2hhbXAtNDc2OTEyOQ=="],
};

export const mapping: { [key: string]: string } = Object.fromEntries(
  Object.entries(descriptorIds).flatMap(([key, values]) =>
    values.map((value) => [value, key]),
  ),
);
