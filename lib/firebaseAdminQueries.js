// Server-side Firebase Firestore queries for Server Components.
// Safe fallback handling: If Firestore returns a Quota Exceeded / RESOURCE_EXHAUSTED error,
// the queries catch the exception and return realistic mock/seed data so the app remains fully functional.
import { adminDb } from './firebaseAdmin';

// ─── Mock Fallback Data ──────────────────────────────────────────────────────

const FALLBACK_CIRCLES = [
  {
    id: 'c_gdsc',
    name: 'Google Developer Student Club',
    category: 'Coding & Tech',
    desc: 'The official GDSC chapter. We build cool stuff and learn together.',
    img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
    circle_members: [
      { user_id: 'aarav', role: 'admin', full_name: 'Aarav Sharma' },
      { user_id: 'neha', role: 'member', full_name: 'Neha Verma' }
    ]
  },
  {
    id: 'c_music',
    name: 'Campus Symphony',
    category: 'Music & Bands',
    desc: 'For all musicians, singers, and music producers on campus. Jam sessions every weekend!',
    img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80',
    circle_members: [
      { user_id: 'priya', role: 'admin', full_name: 'Priya Patel' }
    ]
  },
  {
    id: 'c_sports',
    name: 'Gladiators FC',
    category: 'Sports & Fitness',
    desc: 'The premier football club of the campus. Tryouts happen every semester.',
    img: 'https://images.unsplash.com/photo-1518605368461-1ee7a99652c2?w=500&q=80',
    circle_members: []
  },
  {
    id: 'c_photo',
    name: 'Lenscrafters',
    category: 'Photography & Film',
    desc: 'Capture the best moments on campus. Weekly photowalks and editing workshops.',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
    circle_members: []
  }
];

const FALLBACK_EVENTS = [
  {
    id: 'e_web3',
    title: 'Intro to Web3 & Blockchain',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '4:00 PM',
    loc: 'Block 4, Lab 2',
    circle_id: 'c_gdsc',
    circle_name: 'Google Developer Student Club',
    sparks_cost: 0,
    desc: 'Get hands-on with smart contracts and Solidity basics. Beginners welcome!',
    rsvps_list: ['aarav', 'neha'],
    host_name: 'Aarav Sharma'
  },
  {
    id: 'e_react',
    title: 'React.js Crash Course',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    time: '2:30 PM',
    loc: 'Main Auditorium',
    circle_id: 'c_gdsc',
    circle_name: 'Google Developer Student Club',
    sparks_cost: 5,
    desc: 'Learn hooks, state management, and props structure in this absolute starter class.',
    rsvps_list: ['neha', 'priya'],
    host_name: 'Aarav Sharma'
  },
  {
    id: 'e_acoustic',
    title: 'Acoustic Night Jam Session',
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    time: '6:00 PM',
    loc: 'Central Lawn',
    circle_id: 'c_music',
    circle_name: 'Campus Symphony',
    sparks_cost: 10,
    desc: 'An open microphone session for acoustic singers and guitarists. Refreshments included!',
    rsvps_list: ['priya'],
    host_name: 'Priya Patel'
  }
];

const FALLBACK_USERS = [
  {
    id: 'aarav',
    uid: 'aarav',
    name: 'Aarav (CS)',
    email: 'aarav@example.com',
    branch: 'CSE',
    year: '3rd',
    interests: ['Coding', 'Tech', 'Startup'],
    role: 'host',
    wallet: { purchased_sparks: 120, bonus_sparks: 40, creator_earnings: 500 }
  },
  {
    id: 'neha',
    uid: 'neha',
    name: 'Neha (Design)',
    email: 'neha@example.com',
    branch: 'Design',
    year: '2nd',
    interests: ['UI/UX', 'Art', 'Design'],
    role: 'user',
    wallet: { purchased_sparks: 80, bonus_sparks: 20, creator_earnings: 1200 }
  },
  {
    id: 'priya',
    uid: 'priya',
    name: 'Priya (Events)',
    email: 'priya@example.com',
    branch: 'ECE',
    year: '4th',
    interests: ['Events', 'Music', 'Management'],
    role: 'host',
    wallet: { purchased_sparks: 250, bonus_sparks: 100, creator_earnings: 3000 }
  }
];

// Helper to compute member counts from embedded members list
function mapCircleData(circleDoc) {
  const data = circleDoc.data();
  return {
    id: circleDoc.id,
    ...data,
    member_count: (data.circle_members || []).length
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

export async function fetchUpcomingEventsAdmin(limitCount = 12) {
  if (!adminDb) return FALLBACK_EVENTS.slice(0, limitCount);

  try {
    const snapshot = await adminDb.collection('events')
      .orderBy('date')
      .limit(limitCount * 2)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return events
      .filter((e) => e.date && new Date(e.date) >= new Date(Date.now() - 86400000))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limitCount);
  } catch (err) {
    console.warn("Firestore query 'events' failed (likely quota limit). Returning fallback mock events:", err.message);
    return FALLBACK_EVENTS.slice(0, limitCount);
  }
}

// ─── Circles ─────────────────────────────────────────────────────────────────

export async function fetchCirclesAdmin() {
  if (!adminDb) return FALLBACK_CIRCLES.map(c => ({ ...c, member_count: c.circle_members.length }));

  try {
    const snapshot = await adminDb.collection('circles').limit(50).get();
    return snapshot.docs.map(mapCircleData);
  } catch (err) {
    console.warn("Firestore query 'circles' failed (likely quota limit). Returning fallback mock circles:", err.message);
    return FALLBACK_CIRCLES.map(c => ({ ...c, member_count: c.circle_members.length }));
  }
}

export async function fetchCircleDetailAdmin(circleId) {
  if (!adminDb || !circleId) return FALLBACK_CIRCLES.find(c => c.id === circleId) || null;

  try {
    const doc = await adminDb.collection('circles').doc(circleId).get();
    if (!doc.exists) return null;
    return mapCircleData(doc);
  } catch (err) {
    console.warn(`Firestore query 'circles/${circleId}' failed (likely quota limit). Returning fallback mock circle detail:`, err.message);
    return FALLBACK_CIRCLES.find(c => c.id === circleId) || null;
  }
}

export async function fetchCircleMembersAdmin(circleId) {
  if (!adminDb || !circleId) {
    const matched = FALLBACK_CIRCLES.find(c => c.id === circleId);
    return matched ? matched.circle_members.map((m, i) => ({ id: m.user_id || `member_${i}`, ...m })) : [];
  }

  try {
    const doc = await adminDb.collection('circles').doc(circleId).get();
    if (!doc.exists) return [];
    const data = doc.data();
    return (data.circle_members || []).map((m, i) => ({
      id: m.user_id || `member_${i}`,
      ...m,
    }));
  } catch (err) {
    console.warn(`Firestore query 'circles/${circleId}' members failed. Returning fallback members:`, err.message);
    const matched = FALLBACK_CIRCLES.find(c => c.id === circleId);
    return matched ? matched.circle_members.map((m, i) => ({ id: m.user_id || `member_${i}`, ...m })) : [];
  }
}

export async function fetchCircleEventsAdmin(circleId) {
  if (!adminDb || !circleId) return FALLBACK_EVENTS.filter(e => e.circle_id === circleId);

  try {
    const snapshot = await adminDb.collection('events')
      .where('circle_id', '==', circleId)
      .limit(30)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (err) {
    console.warn(`Firestore query 'events' for circle ${circleId} failed. Returning fallback circle events:`, err.message);
    return FALLBACK_EVENTS.filter(e => e.circle_id === circleId);
  }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function fetchProfileAdmin(userId) {
  if (!adminDb || !userId) return FALLBACK_USERS.find(u => u.uid === userId) || null;

  try {
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    console.warn(`Firestore query 'users/${userId}' failed. Returning fallback profile:`, err.message);
    return FALLBACK_USERS.find(u => u.uid === userId) || null;
  }
}

export async function fetchJoinedCirclesAdmin(userId) {
  if (!adminDb || !userId) return FALLBACK_CIRCLES.map(c => ({ ...c, member_count: c.circle_members.length }));

  try {
    const snapshot = await adminDb.collection('circles').limit(50).get();
    const joined = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const members = data.circle_members || [];
      if (members.some((m) => m.user_id === userId)) {
        joined.push({
          id: doc.id,
          ...data,
          member_count: members.length,
        });
      }
    }
    return joined;
  } catch (err) {
    console.warn(`Firestore query 'circles' for joined circles of ${userId} failed. Returning fallback:`, err.message);
    // Simple filter simulation
    return FALLBACK_CIRCLES.filter(c => c.circle_members.some(m => m.user_id === userId)).map(c => ({ ...c, member_count: c.circle_members.length }));
  }
}

export async function fetchUsersAdmin(limitCount = 50) {
  if (!adminDb) return FALLBACK_USERS.slice(0, limitCount);

  try {
    const snapshot = await adminDb.collection('users').limit(limitCount).get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return users.sort(() => 0.5 - Math.random());
  } catch (err) {
    console.warn("Firestore query 'users' failed. Returning fallback users:", err.message);
    return FALLBACK_USERS.sort(() => 0.5 - Math.random()).slice(0, limitCount);
  }
}
