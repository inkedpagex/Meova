import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/getAdminUser';

// High-fidelity pre-populated posts & student cabin spots
const ALL_FEED_ITEMS = [
  // Page 1
  {
    id: 'spot_1',
    type: 'spot',
    hostId: 'ananya',
    hostName: 'Ananya Kapoor',
    year: '3rd Year',
    branch: 'Biotech',
    cabinName: 'Cabin #204: Biotech & Literature Study',
    desc: 'Setting up a quiet study room for exam prep. Perfect for focused reading, report drafting, or general academic advice. Whiteboard and tea included.',
    sparksCost: 50,
    availability: 'Available Today, 3:00 PM - 6:00 PM',
    avatar: 'Ananya Kapoor',
    tags: ['Quiet Focus', 'Exam Prep']
  },
  {
    id: 'post_1',
    type: 'post',
    authorName: 'Aarav Sharma',
    avatar: 'Aarav Sharma',
    content: 'Just deployed the new campus events notification system! Let me know if you run into any bugs or have feature ideas. 🚀',
    timestamp: '10 mins ago',
    likes: 24,
    comments: 5
  },
  {
    id: 'spot_2',
    type: 'spot',
    hostId: 'riya',
    hostName: 'Riya Sen',
    year: '1st Year',
    branch: 'CSE',
    cabinName: 'Cabin #108: DSA & Retro Gaming Co-working',
    desc: 'Working on recursion problems and building a simple 2D game. Stop by my workspace cabin if you want to pair program or learn python coding basics!',
    sparksCost: 80,
    availability: 'Available Today, 5:00 PM - 8:00 PM',
    avatar: 'Riya Sen',
    tags: ['Web Dev', 'Coding Help']
  },
  {
    id: 'post_2',
    type: 'post',
    authorName: 'Neha Verma',
    avatar: 'Neha Verma',
    content: 'Any designers on campus interested in forming a team for the upcoming UI/UX Hackathon? Send me a DM! 🎨✨',
    timestamp: '1 hour ago',
    likes: 15,
    comments: 3
  },
  {
    id: 'spot_3',
    type: 'spot',
    hostId: 'isha',
    hostName: 'Isha Sharma',
    year: '2nd Year',
    branch: 'Management',
    cabinName: 'Cabin #412: Startup Ideation & Pitch Deck Corner',
    desc: 'Reviewing pitch decks and working on marketing case studies today. Reserve a slot at my cabin if you want feedback on your business plan or general consulting.',
    sparksCost: 100,
    availability: 'Available Tomorrow, 2:00 PM - 5:00 PM',
    avatar: 'Isha Sharma',
    tags: ['Startup', 'Marketing']
  },

  // Page 2
  {
    id: 'post_3',
    type: 'post',
    authorName: 'Priya Patel',
    avatar: 'Priya Patel',
    content: 'Jamming session this Saturday at the central lawn! Bring your acoustic guitars, ukuleles, or just come to vibe. 🎶🎸',
    timestamp: '3 hours ago',
    likes: 42,
    comments: 12
  },
  {
    id: 'spot_4',
    type: 'spot',
    hostId: 'sneha',
    hostName: 'Sneha Reddy',
    year: '3rd Year',
    branch: 'Design',
    cabinName: 'Cabin #301: Fashion Design & Moodboard Spot',
    desc: 'Arranging moodboards for our term project. If you are interested in sketching, digital fashion design, or street photography editing, come co-work with me.',
    sparksCost: 75,
    availability: 'Available Today, 6:30 PM - 9:30 PM',
    avatar: 'Sneha Reddy',
    tags: ['Design', 'Creative Focus']
  },
  {
    id: 'post_4',
    type: 'post',
    authorName: 'Ananya Kapoor',
    avatar: 'Ananya Kapoor',
    content: 'Spent the whole afternoon reading in the library. Highly recommend the poetry section on the 2nd floor, super quiet! 📚🍂',
    timestamp: '4 hours ago',
    likes: 18,
    comments: 2
  },
  {
    id: 'spot_5',
    type: 'spot',
    hostId: 'neha',
    hostName: 'Neha Verma',
    year: '2nd Year',
    branch: 'Design',
    cabinName: 'Cabin #305: Portfolio Review & Figma Lab',
    desc: 'Free slot to collaborate or get direct feedback on your UX research and design files. I have a secondary monitor ready for screen-sharing!',
    sparksCost: 60,
    availability: 'Available Wednesday, 1:00 PM - 4:00 PM',
    avatar: 'Neha Verma',
    tags: ['UX Portfolio', 'Figma']
  },
  {
    id: 'post_5',
    type: 'post',
    authorName: 'Riya Sen',
    avatar: 'Riya Sen',
    content: 'Just finished playing a match of Valorant. Is there a gaming club or clan on campus? 🎮🎮',
    timestamp: '6 hours ago',
    likes: 9,
    comments: 4
  },

  // Page 3 (Infinite scroll generator fallback)
  {
    id: 'post_6',
    type: 'post',
    authorName: 'Isha Sharma',
    avatar: 'Isha Sharma',
    content: 'Working on a new e-commerce project pitch. Networking is key, let\'s catch up if you are interested in SaaS products.',
    timestamp: '1 day ago',
    likes: 27,
    comments: 6
  },
  {
    id: 'spot_6',
    type: 'spot',
    hostId: 'priya',
    hostName: 'Priya Patel',
    year: '4th Year',
    branch: 'ECE',
    cabinName: 'Cabin #202: Audio Engineering & Beat Production',
    desc: 'Recording acoustic vocals and mastering beats. Book a session if you want to learn basics of Ableton Live or sound design.',
    sparksCost: 90,
    availability: 'Available Friday, 3:00 PM - 7:00 PM',
    avatar: 'Priya Patel',
    tags: ['Music Prod', 'Audio Eng']
  },
  {
    id: 'post_7',
    type: 'post',
    authorName: 'Sneha Reddy',
    avatar: 'Sneha Reddy',
    content: 'Captured some beautiful shots of the campus during golden hour yesterday. Thinking of holding a mini exhibition! 📸✨',
    timestamp: '1 day ago',
    likes: 56,
    comments: 8
  }
];

export async function GET(request) {
  const currentUser = await requireAuth();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const type = searchParams.get('type') || 'all'; // 'all' | 'spots' | 'posts'
  const limit = 5;

  let filtered = ALL_FEED_ITEMS;
  if (type === 'spots') {
    filtered = ALL_FEED_ITEMS.filter(item => item.type === 'spot');
  } else if (type === 'posts') {
    filtered = ALL_FEED_ITEMS.filter(item => item.type === 'post');
  }

  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  // Return items and indicators for pagination
  const hasMore = startIndex + limit < filtered.length;

  return NextResponse.json({
    items: paginatedItems,
    hasMore,
    nextPage: page + 1
  });
}
