/**
 * lib/constants/universities.js
 * Comprehensive list of top colleges & universities for multi-campus support.
 * GLA University is prioritized at the top with featured status.
 */

export const UNIVERSITIES = [
  { id: 'gla', name: 'GLA University, Mathura', location: 'Mathura, UP', featured: true, popular: true },
  { id: 'iit-delhi', name: 'IIT Delhi', location: 'New Delhi', popular: true },
  { id: 'iit-bombay', name: 'IIT Bombay', location: 'Mumbai, Maharashtra', popular: true },
  { id: 'iit-kanpur', name: 'IIT Kanpur', location: 'Kanpur, UP', popular: true },
  { id: 'iit-roorkee', name: 'IIT Roorkee', location: 'Roorkee, Uttarakhand', popular: true },
  { id: 'iit-bhu', name: 'IIT BHU (Varanasi)', location: 'Varanasi, UP', popular: true },
  { id: 'bits-pilani', name: 'BITS Pilani', location: 'Pilani, Rajasthan', popular: true },
  { id: 'dtu', name: 'Delhi Technological University (DTU)', location: 'New Delhi', popular: true },
  { id: 'nsut', name: 'Netaji Subhas University of Technology (NSUT)', location: 'New Delhi', popular: true },
  { id: 'du', name: 'Delhi University (DU)', location: 'New Delhi', popular: true },
  { id: 'amity-noida', name: 'Amity University, Noida', location: 'Noida, UP', popular: true },
  { id: 'galgotias', name: 'Galgotias University', location: 'Greater Noida, UP', popular: true },
  { id: 'bennett', name: 'Bennett University', location: 'Greater Noida, UP', popular: true },
  { id: 'sharda', name: 'Sharda University', location: 'Greater Noida, UP', popular: true },
  { id: 'lpu', name: 'Lovely Professional University (LPU)', location: 'Phagwara, Punjab', popular: true },
  { id: 'cu', name: 'Chandigarh University', location: 'Mohali, Punjab', popular: true },
  { id: 'vit-vellore', name: 'VIT Vellore', location: 'Vellore, Tamil Nadu', popular: true },
  { id: 'srm', name: 'SRM Institute of Science & Technology', location: 'Chennai, Tamil Nadu', popular: true },
  { id: 'manipal', name: 'Manipal Academy of Higher Education (MAHE)', location: 'Manipal, Karnataka', popular: true },
  { id: 'thapar', name: 'Thapar Institute of Engineering & Technology', location: 'Patiala, Punjab', popular: true },
  { id: 'kiit', name: 'KIIT University', location: 'Bhubaneswar, Odisha', popular: true },
  { id: 'snu', name: 'Shiv Nadar University', location: 'Greater Noida, UP' },
  { id: 'ashoka', name: 'Ashoka University', location: 'Sonipat, Haryana' },
  { id: 'bhu', name: 'Banaras Hindu University (BHU)', location: 'Varanasi, UP' },
  { id: 'amu', name: 'Aligarh Muslim University (AMU)', location: 'Aligarh, UP' },
  { id: 'jmi', name: 'Jamia Millia Islamia', location: 'New Delhi' },
  { id: 'christ', name: 'Christ University', location: 'Bengaluru, Karnataka' },
  { id: 'symbiosis', name: 'Symbiosis International University', location: 'Pune, Maharashtra' },
  { id: 'aktu', name: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)', location: 'Lucknow, UP' },
  { id: 'other', name: 'Other College / University', location: 'India' },
];

export const DEFAULT_UNIVERSITY = 'GLA University, Mathura';

/**
 * Helper to search universities:
 * If query matches 'g', 'gla', 'mathura', GLA is prioritized first.
 */
export function searchUniversities(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return all, starting with GLA
    return UNIVERSITIES;
  }

  const results = UNIVERSITIES.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.location.toLowerCase().includes(q) ||
    (u.id && u.id.toLowerCase().includes(q))
  );

  // If GLA matches, ensure it stays at position 0
  const glaIdx = results.findIndex(u => u.id === 'gla');
  if (glaIdx > 0) {
    const [gla] = results.splice(glaIdx, 1);
    results.unshift(gla);
  }

  return results;
}
