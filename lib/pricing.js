/**
 * lib/pricing.js
 * Dynamic Tiered Meetup Pricing Progression System for Meova
 * 
 * Rules:
 * - Students cannot manually edit their meetup rate.
 * - Base rate = 100 Sparks.
 * - Tier Progression based on verified completed meetups (status = 'Completed'):
 *   - 0 – 2 Completed Meets: 100 Sparks (Campus Starter)
 *   - 3 – 5 Completed Meets: 200 Sparks (Verified Peer)
 *   - 6 – 9 Completed Meets: 350 Sparks (Popular Host)
 *   - 10 – 14 Completed Meets: 500 Sparks (Campus Senior)
 *   - 15 – 19 Completed Meets: 750 Sparks (Star Mentor)
 *   - 20+ Completed Meets: 1000 Sparks (Campus Legend - Max Cap)
 */

export const PRICING_TIERS = [
  { minMeets: 0,  maxMeets: 2,        price: 100,  name: 'Campus Starter', tier: 1, nextAt: 3 },
  { minMeets: 3,  maxMeets: 5,        price: 200,  name: 'Verified Peer',  tier: 2, nextAt: 6 },
  { minMeets: 6,  maxMeets: 9,        price: 350,  name: 'Popular Host',   tier: 3, nextAt: 10 },
  { minMeets: 10, maxMeets: 14,       price: 500,  name: 'Campus Senior',  tier: 4, nextAt: 15 },
  { minMeets: 15, maxMeets: 19,       price: 750,  name: 'Star Mentor',    tier: 5, nextAt: 20 },
  { minMeets: 20, maxMeets: Infinity, price: 1000, name: 'Campus Legend',  tier: 6, nextAt: null },
];

/**
 * Calculates the exact meetup rate in Sparks for a given host
 * @param {number} completedMeetsCount - Count of completed meetups
 * @returns {number} Price in Sparks (100 to 1000)
 */
export function calculateMeetupRate(completedMeetsCount = 0) {
  const count = Math.max(0, parseInt(completedMeetsCount, 10) || 0);
  if (count >= 20) return 1000;
  if (count >= 15) return 750;
  if (count >= 10) return 500;
  if (count >= 6)  return 350;
  if (count >= 3)  return 200;
  return 100;
}

/**
 * Returns full tier details, badges, and progress to next level
 * @param {number} completedMeetsCount 
 * @returns {object} { tier, name, price, currentMeets, nextAt, meetsNeeded, isMaxTier }
 */
export function getTierInfo(completedMeetsCount = 0) {
  const count = Math.max(0, parseInt(completedMeetsCount, 10) || 0);
  const matchedTier = PRICING_TIERS.find(t => count >= t.minMeets && count <= t.maxMeets) || PRICING_TIERS[0];
  
  return {
    tier: matchedTier.tier,
    tierName: matchedTier.name,
    price: matchedTier.price,
    currentMeets: count,
    nextAt: matchedTier.nextAt,
    meetsNeeded: matchedTier.nextAt ? Math.max(0, matchedTier.nextAt - count) : 0,
    isMaxTier: matchedTier.nextAt === null,
  };
}
