// Server-side Firebase Firestore queries for Server Components.
// Refactored to exclusively use ultra-realistic mock data for instant Vercel Serverless rendering.

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
    full_name: 'Aarav Sharma',
    email: 'aarav@example.com',
    branch: 'CSE',
    year: '3rd',
    interests: ['Coding & Tech', 'Entrepreneurship'],
    bio: 'Building Next-gen campus tools. Let\'s co-work on tech projects!',
    role: 'host',
    wallet: { purchased_sparks: 120, bonus_sparks: 40, creator_earnings: 500 }
  },
  {
    id: 'neha',
    uid: 'neha',
    full_name: 'Neha Verma',
    email: 'neha@example.com',
    branch: 'Design',
    year: '2nd',
    interests: ['Art & Sketching', 'Coding & Tech'],
    bio: 'UI/UX enthusiast. Let\'s review portfolio designs together.',
    role: 'user',
    wallet: { purchased_sparks: 80, bonus_sparks: 20, creator_earnings: 1200 }
  },
  {
    id: 'priya',
    uid: 'priya',
    full_name: 'Priya Patel',
    email: 'priya@example.com',
    branch: 'ECE',
    year: '4th',
    interests: ['Music & Bands', 'Literature & Poetry'],
    bio: 'Acoustic jam partner. Happy to co-study or discuss creative writing!',
    role: 'host',
    wallet: { purchased_sparks: 250, bonus_sparks: 100, creator_earnings: 3000 }
  },
  {
    id: 'ananya',
    uid: 'ananya',
    full_name: 'Ananya Kapoor',
    email: 'ananya@example.com',
    branch: 'Biotech',
    year: '3rd',
    interests: ['Literature & Poetry', 'Art & Sketching'],
    bio: 'Avid reader & digital artist. Book my cabin for a quiet study session or creative feedback.',
    role: 'user',
    wallet: { purchased_sparks: 150, bonus_sparks: 30, creator_earnings: 850 }
  },
  {
    id: 'riya',
    uid: 'riya',
    full_name: 'Riya Sen',
    email: 'riya@example.com',
    branch: 'CSE',
    year: '1st',
    interests: ['Coding & Tech', 'Gaming & E-sports'],
    bio: 'Passionate about cybersecurity and retro arcade gaming. Let\'s study web development or discuss game dev!',
    role: 'user',
    wallet: { purchased_sparks: 90, bonus_sparks: 10, creator_earnings: 600 }
  },
  {
    id: 'isha',
    uid: 'isha',
    full_name: 'Isha Sharma',
    email: 'isha@example.com',
    branch: 'Management',
    year: '2nd',
    interests: ['Entrepreneurship', 'Photography & Film'],
    bio: 'Aspiring startup founder. Let\'s exchange product ideas and work on marketing case studies!',
    role: 'user',
    wallet: { purchased_sparks: 200, bonus_sparks: 50, creator_earnings: 1500 }
  },
  {
    id: 'sneha',
    uid: 'sneha',
    full_name: 'Sneha Reddy',
    email: 'sneha@example.com',
    branch: 'Design',
    year: '3rd',
    interests: ['Art & Sketching', 'Photography & Film'],
    bio: 'Fashion designer & street photographer. Book a slot at my workspace cabin for brainstorming and creative work.',
    role: 'user',
    wallet: { purchased_sparks: 300, bonus_sparks: 80, creator_earnings: 2100 }
  }
];

// ─── Events ──────────────────────────────────────────────────────────────────

export async function fetchUpcomingEventsAdmin(limitCount = 12) {
  return FALLBACK_EVENTS.slice(0, limitCount);
}

// ─── Circles ─────────────────────────────────────────────────────────────────

export async function fetchCirclesAdmin() {
  return FALLBACK_CIRCLES.map(c => ({ ...c, member_count: c.circle_members.length }));
}

export async function fetchCircleDetailAdmin(circleId) {
  const matched = FALLBACK_CIRCLES.find(c => c.id === circleId);
  if (!matched) return null;
  return { ...matched, member_count: matched.circle_members.length };
}

export async function fetchCircleMembersAdmin(circleId) {
  const matched = FALLBACK_CIRCLES.find(c => c.id === circleId);
  return matched ? matched.circle_members.map((m, i) => ({ id: m.user_id || `member_${i}`, ...m })) : [];
}

export async function fetchCircleEventsAdmin(circleId) {
  return FALLBACK_EVENTS.filter(e => e.circle_id === circleId);
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function fetchProfileAdmin(userId) {
  const matched = FALLBACK_USERS.find(u => u.uid === userId) || null;
  if (!matched) return null;

  try {
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__meetify_session')?.value;
    if (sessionCookie) {
      const base64Url = sessionCookie.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const decoded = JSON.parse(jsonPayload);
      if (decoded && decoded.user_id === userId) {
        const ovStr = cookieStore.get('__meetify_profile_overrides')?.value;
        if (ovStr) {
          const overrides = JSON.parse(ovStr);
          return { ...matched, ...overrides };
        }
      }
    }
  } catch (e) {}

  return matched;
}

export async function fetchJoinedCirclesAdmin(userId) {
  return FALLBACK_CIRCLES.filter(c => c.circle_members.some(m => m.user_id === userId)).map(c => ({ ...c, member_count: c.circle_members.length }));
}

export async function fetchUsersAdmin(limitCount = 50) {
  return FALLBACK_USERS.sort(() => 0.5 - Math.random()).slice(0, limitCount);
}
