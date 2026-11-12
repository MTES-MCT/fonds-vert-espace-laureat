export const DEMO_POOL_NUMBER = 102;
export const DEMO_DOSSIER_NUMBERS: readonly number[] = [
  101,
  DEMO_POOL_NUMBER,
  103,
  104,
];
export const LEGACY_DEMO_NUMBER = 99999999;

export function isReservedDemoDossier(number: number) {
  return number === LEGACY_DEMO_NUMBER || DEMO_DOSSIER_NUMBERS.includes(number);
}
