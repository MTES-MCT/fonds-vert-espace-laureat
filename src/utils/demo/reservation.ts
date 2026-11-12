export const DEMO_SCHOOL_NUMBER = 101;
export const DEMO_POOL_NUMBER = 102;
export const DEMO_COMPOST_NUMBER = 103;
export const DEMO_GYM_NUMBER = 104;
export const DEMO_DOSSIER_NUMBERS: readonly number[] = [
  DEMO_SCHOOL_NUMBER,
  DEMO_POOL_NUMBER,
  DEMO_COMPOST_NUMBER,
  DEMO_GYM_NUMBER,
];
export const LEGACY_DEMO_NUMBER = 99999999;

export function isReservedDemoDossier(number: number) {
  return number === LEGACY_DEMO_NUMBER || DEMO_DOSSIER_NUMBERS.includes(number);
}
