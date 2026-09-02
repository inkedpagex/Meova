/**
 * lib/algorithm/recommendationEngine.js
 * Campus Activity & Affinity-Based Recommendation Engine for Meova
 * 
 * Rules:
 * 1. Active Users on Top: Users with completed meetups, posts, gigs, and rich bios score highest.
 * 2. Ghost Account Demotion: Accounts with 0 activity, empty bios, or no engagement sink to the bottom.
 * 3. Personalized Affinity: Every student sees a custom order based on matching interests, branch synergy, and mutual passions.
 * 4. Freshness Jitter: Controlled pseudorandom variation ensures daily discovery stays vibrant and non-repetitive.
 */

/**
 * Parses user interests/skills into a normalized set of lowercase strings
 */
export function normalizeInterests(user) {
  if (!user) return new Set();
  const raw = [];
  
  if (Array.isArray(user.interests)) raw.push(...user.interests);
  else if (typeof user.interests === 'string') raw.push(...user.interests.split(/[,|\n]/));
  
  if (Array.isArray(user.skills)) raw.push(...user.skills);
  else if (typeof user.skills === 'string') raw.push(...user.skills.split(/[,|\n]/));

  if (Array.isArray(user.hobbies)) raw.push(...user.hobbies);
  else if (typeof user.hobbies === 'string') raw.push(...user.hobbies.split(/[,|\n]/));

  const set = new Set();
  raw.forEach(item => {
    if (typeof item === 'string') {
      const clean = item.trim().toLowerCase();
      if (clean.length >= 2) set.add(clean);
    }
  });
  return set;
}

/**
 * Computes Activity / Karma score for a candidate profile
 * Higher score = more active, trusted, and engaging on campus
 */
export function calculateActivityScore(candidate) {
  if (!candidate) return 0;
  let score = 0;

  // 1. Completed Meetups (+30 pts each) — strongest real-world proof
  const meetsCount = Number(candidate.completed_meets_count || candidate.completedMeets || candidate.total_meets || 0);
  score += Math.min(meetsCount * 30, 300);

  // 2. Profile Richness (+5 to +15 pts each)
  const bio = (candidate.bio || '').trim();
  if (bio.length > 20) score += 20;
  else if (bio.length > 5) score += 10;

  if (candidate.avatar_url && !candidate.avatar_url.includes('placeholder')) score += 15;
  if (candidate.branch) score += 10;
  if (candidate.year) score += 5;
  if (candidate.instagram || candidate.linkedin || candidate.github) score += 10;

  // 3. User engagement & rating (+25 pts for high rating)
  const rating = Number(candidate.avg_rating || candidate.rating || 0);
  if (rating >= 4.5) score += 25;
  else if (rating >= 4.0) score += 15;

  // 4. Recency bonus if updated recently
  if (candidate.updated_at) {
    const hoursSinceUpdate = (Date.now() - new Date(candidate.updated_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 48) score += 25;
    else if (hoursSinceUpdate < 168) score += 15; // Within 1 week
  }

  return score;
}

/**
 * Computes Personalized Affinity score between current viewer and candidate
 * Higher score = closer match in hobbies, branch, year, and passions
 */
export function calculateAffinityScore(currentUser, candidate) {
  if (!currentUser || !candidate || currentUser.id === candidate.id) return { score: 0, mutuals: [], reason: '' };
  
  let score = 0;
  const userInterests = normalizeInterests(currentUser);
  const candidateInterests = normalizeInterests(candidate);

  // 1. Shared Interests Match (+25 pts per mutual topic)
  const mutuals = [];
  candidateInterests.forEach(tag => {
    if (userInterests.has(tag)) {
      mutuals.push(tag);
      score += 25;
    }
  });

  // 2. Branch & Department Synergy (+20 pts for same branch)
  const userBranch = (currentUser.branch || '').toUpperCase().trim();
  const candidateBranch = (candidate.branch || '').toUpperCase().trim();
  let branchMatch = false;
  if (userBranch && candidateBranch && (userBranch === candidateBranch || userBranch.includes(candidateBranch) || candidateBranch.includes(userBranch))) {
    score += 20;
    branchMatch = true;
  }

  // 3. Peer Batch / Year Dynamics (+15 pts)
  const userYr = (currentUser.year || '').toString().toLowerCase().replace(/\D/g, '');
  const candidateYr = (candidate.year || '').toString().toLowerCase().replace(/\D/g, '');
  let yearMatch = false;
  if (userYr && candidateYr) {
    if (userYr === candidateYr) {
      score += 15; // Same batch peer
      yearMatch = true;
    } else if (Number(candidateYr) > Number(userYr)) {
      score += 12; // Senior mentor connection
    }
  }

  // 4. Generate user-facing affinity badge / reason
  let reason = '';
  if (mutuals.length > 0) {
    const formatted = mutuals.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ');
    reason = `Both into ${formatted}`;
  } else if (branchMatch && userBranch) {
    reason = `Same Department · ${userBranch}`;
  } else if (yearMatch && userYr) {
    reason = `Batchmate · Year ${userYr}`;
  } else if (Number(candidate.completed_meets_count || 0) >= 3) {
    reason = `Active Campus Host · ${candidate.completed_meets_count} Meets`;
  }

  return { score, mutuals, reason };
}

/**
 * Ranks candidate peers for a specific user using combined weighted score
 * @param {object} currentUser - The logged in user
 * @param {Array} candidateUsers - Pool of active users from database
 * @param {object} options - Optional config
 * @returns {Array} Sorted array of personalized user profiles with affinity metadata
 */
export function rankPeersForUser(currentUser, candidateUsers = [], options = {}) {
  if (!Array.isArray(candidateUsers) || candidateUsers.length === 0) return [];

  const scoredUsers = candidateUsers.map(candidate => {
    const activityScore = calculateActivityScore(candidate);
    const { score: affinityScore, mutuals, reason } = calculateAffinityScore(currentUser, candidate);
    
    // Freshness jitter: small pseudorandom offset (0 to 6) to keep daily exploration fresh
    const jitter = (Math.random() * 6);

    // Weighted Formula:
    // 50% Activity + 45% Personalized Affinity + 5% Freshness Jitter
    const totalScore = (activityScore * 0.50) + (affinityScore * 0.45) + jitter;

    return {
      ...candidate,
      _algorithmScore: Math.round(totalScore),
      _mutualInterests: mutuals,
      _affinityReason: reason || candidate.headline || 'GLA Classmate',
      _isHighlyActive: activityScore >= 60,
    };
  });

  // Sort descending by calculated algorithm score
  scoredUsers.sort((a, b) => b._algorithmScore - a._algorithmScore);

  return scoredUsers;
}

/**
 * Ranks Moments / Feed posts based on author activity, engagement, and freshness
 */
export function rankMomentsForUser(currentUser, posts = []) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const scored = posts.map(post => {
    let score = 0;

    // 1. Engagement signals (likes, comments)
    const likesCount = Number(post.likes_count || post.likesCount || 0);
    const commentsCount = Number(post.comments_count || post.commentsCount || 0);
    score += (likesCount * 3) + (commentsCount * 6);

    // 2. Author activity & trust
    const authorMeets = Number(post.author_completed_meets || post.author?.completed_meets_count || 0);
    score += Math.min(authorMeets * 5, 50);

    // 3. Time Decay (Exponential freshness penalty)
    if (post.created_at) {
      const hoursAge = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursAge < 12) score += 40;
      else if (hoursAge < 24) score += 25;
      else if (hoursAge < 72) score += 10;
      else score -= Math.min(hoursAge * 0.5, 40); // Older posts slowly decay
    }

    return {
      ...post,
      _momentScore: score,
    };
  });

  scored.sort((a, b) => b._momentScore - a._momentScore);
  return scored;
}
