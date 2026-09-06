/**
 * lib/collegeSlug.js
 * Utilities for URL slug generation and college resolution
 */

export function slugifyCollege(name = '') {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Common acronyms and aliases mapping to exact college names
export const COLLEGE_ALIASES = {
  'gla': 'GLA University',
  'gla-university': 'GLA University',
  'dtu': 'Delhi Technological University',
  'hcst': 'Hindustan College of Science and Technology (HCST)',
  'akgec': 'Ajay Kumar Garg Engineering College (AKGEC)',
  'abes': 'ABES Engineering College',
  'jiit': 'Jaypee Institute of Information Technology (JIIT)',
  'kiet': 'KIET Group of Institutions',
  'psit': 'Pranveer Singh Institute of Technology (PSIT)',
  'dei': 'Dayalbagh Educational Institute (DEI)',
  'bhu': 'Banaras Hindu University (BHU)',
  'iitk': 'IIT Kanpur',
  'mnnit': 'MNNIT Allahabad',
  'bbdu': 'Babu Banarasi Das University (BBDU)',
  'srmu': 'Shri Ramswaroop Memorial University (SRMU)',
  'tmu': 'Teerthanker Mahaveer University (TMU)',
  'niu': 'Noida International University (NIU)',
};

/**
 * Resolves a college record from Supabase matching the provided slug.
 */
export async function getCollegeBySlug(slug, supabase) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Fetch all colleges
  const { data: colleges, error } = await supabase
    .from('colleges')
    .select('*');

  if (error || !colleges || colleges.length === 0) {
    return null;
  }

  // 2. Check alias map first
  const aliasedName = COLLEGE_ALIASES[cleanSlug];
  if (aliasedName) {
    const matched = colleges.find(
      (c) => c.name.toLowerCase() === aliasedName.toLowerCase()
    );
    if (matched) return matched;
  }

  // 3. Exact slug match
  const exact = colleges.find((c) => slugifyCollege(c.name) === cleanSlug);
  if (exact) return exact;

  // 4. Fuzzy match: check if cleanSlug contains the name or vice versa
  const fuzzy = colleges.find((c) => {
    const cSlug = slugifyCollege(c.name);
    return cSlug.includes(cleanSlug) || cleanSlug.includes(cSlug);
  });

  return fuzzy || null;
}
