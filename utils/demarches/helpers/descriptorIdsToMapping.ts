export const descriptorIdsToMapping = (descriptorIds: {
  [key: string]: string[];
}): { [key: string]: string } =>
  Object.fromEntries(
    Object.entries(descriptorIds).flatMap(([key, values]) =>
      values.map((value) => [value, key]),
    ),
  );
