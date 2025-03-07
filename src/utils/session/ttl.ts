// Proconnect recommends TTL of a maximum of 12 hours that always expires at midnight
function secondsUntilMidnightAndMax12hours(): number {
  const now = new Date();
  const twelveHoursInSeconds = 12 * 60 * 60;

  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const secondsUntilMidnight = (midnight.getTime() - now.getTime()) / 1000;

  return Math.min(twelveHoursInSeconds, secondsUntilMidnight);
}

export const ttl = secondsUntilMidnightAndMax12hours();
