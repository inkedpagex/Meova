import { supabaseAdmin } from './supabase/admin';

// In-memory cache for ultra-fast response with 10s TTL
let cache = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000;

/**
 * Fetches all feature flags from public.app_settings table
 */
export async function getAllFeatureFlags() {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && Object.keys(cache).length > 0) {
    return cache;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('key, value');

    if (error || !data) {
      // Fallback defaults if table is empty or error
      return {
        feature_gigs: 'false',
        gigs: false,
        ...cache,
      };
    }

    const flags = {};
    data.forEach(row => {
      flags[row.key] = row.value;
      if (row.key === 'feature_gigs') {
        flags.gigs = row.value === 'true' || row.value === true;
      }
    });

    // If feature_gigs is not set in DB, default to false
    if (flags.gigs === undefined) {
      flags.gigs = false;
      flags.feature_gigs = 'false';
    }

    cache = flags;
    lastFetchTime = now;
    return flags;
  } catch (err) {
    console.error('[getAllFeatureFlags]', err.message);
    return { feature_gigs: 'false', gigs: false };
  }
}

/**
 * Checks if a specific feature is enabled
 */
export async function isFeatureEnabled(featureName) {
  const flags = await getAllFeatureFlags();
  const key = featureName.startsWith('feature_') ? featureName : `feature_${featureName}`;
  const val = flags[key] ?? flags[featureName];
  return val === 'true' || val === true;
}

/**
 * Admin updates a feature flag
 */
export async function setFeatureFlag(featureName, isEnabled) {
  const key = featureName.startsWith('feature_') ? featureName : `feature_${featureName}`;
  const strVal = isEnabled ? 'true' : 'false';

  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key,
        value: strVal,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Invalidate local cache
    cache[key] = strVal;
    if (key === 'feature_gigs') cache.gigs = Boolean(isEnabled);
    lastFetchTime = Date.now();

    return { success: true, key, value: strVal };
  } catch (err) {
    console.error('[setFeatureFlag]', err.message);
    return { success: false, error: err.message };
  }
}
