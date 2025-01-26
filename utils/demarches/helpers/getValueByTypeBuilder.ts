import {
  ChampFragmentFragment,
  RootChampFragmentFragment,
} from "@/generated/graphql";

function add<T extends object>(
  mapping: { [key: string]: string },
  acc: T,
  champ: { champDescriptorId: string },
  value?: string[] | string | number | null,
): T {
  return {
    ...acc,
    [mapping[champ.champDescriptorId]]: value,
  };
}

function isChampFragmentFragment(
  champ: ChampFragmentFragment | RootChampFragmentFragment,
): champ is ChampFragmentFragment {
  return champ.__typename !== "RepetitionChamp";
}

export function getValueByTypeBuilder<T extends object>(mapping: {
  [key: string]: string;
}) {
  return function getValueByType(
    champs: T,
    champ: ChampFragmentFragment | RootChampFragmentFragment,
  ): T {
    if (isChampFragmentFragment(champ)) {
      switch (champ.__typename) {
        case "DecimalNumberChamp":
          return add(mapping, champs, champ, champ.decimalNumber);
        case "TextChamp":
          return add(mapping, champs, champ, champ.stringValue);
        case "DateChamp":
          return add(mapping, champs, champ, champ.date);
        case "EngagementJuridiqueChamp":
          return add(mapping, champs, champ, champ.stringValue);
        default:
          return champs;
      }
    } else {
      switch (champ.__typename) {
        case "RepetitionChamp":
          return add(
            mapping,
            champs,
            champ,
            champ.rows
              .flatMap((row) => row.champs.map((c) => c.stringValue))
              .filter((v) => v !== null && v !== undefined),
          );
        default:
          return champs;
      }
    }
  };
}
