import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const DEFAULT_MOCK_POSTS = [
  {
    authorName: 'Aarav Sharma',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav',
    authorBranch: 'B.Tech CSE · 3rd Year',
    photoUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
    caption: 'Finished redesigning the GLA Tech Fest dashboard UI mockups! Feedback is welcome 🚀✨',
    category: 'UI/UX Work',
    location: 'Innovation Lab',
    likes: 24,
    timeAgo: '2h ago',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Ananya Roy',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya',
    authorBranch: 'MBA · 1st Year',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    caption: 'Post-lecture iced matcha @ Central Library Cafe ☕ who is up for a quick study break?',
    category: 'Campus Vibes',
    location: 'Central Cafe',
    likes: 42,
    timeAgo: '4h ago',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Rohan Verma',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan',
    authorBranch: 'B.Tech ECE · 2nd Year',
    photoUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    caption: 'Building real-time peer matching algorithms for Meetify! Exciting updates coming soon 💻🔥',
    category: 'Project Showcase',
    location: 'Library Quiet Zone',
    likes: 38,
    timeAgo: '6h ago',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Kavya Patel',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kavya',
    authorBranch: 'B.Des · 2nd Year',
    photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    caption: 'Jamming at the open-air amphitheater for tomorrow acoustic night! Come vibe with us 🎸🎤',
    category: 'Campus Event',
    location: 'Amphitheater',
    likes: 56,
    timeAgo: '8h ago',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Tanya Deshmukh',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tanya',
    authorBranch: 'B.Tech IT · 3rd Year',
    photoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    caption: 'Just deployed our open-source student notes aggregator app for campus! DM for contributor access 🚀⚡',
    category: 'Dev Showcase',
    location: 'Tech Hub 3',
    likes: 67,
    timeAgo: '10h ago',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Vikram Singh',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram',
    authorBranch: 'B.Tech AI · 4th Year',
    photoUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    caption: '3AM energy drinks & final pitch deck prep for HackCampus 2026! 🏆🔥',
    category: 'Hackathon',
    location: 'Incubation Hub',
    likes: 61,
    timeAgo: '12h ago',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Ishita Sen',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ishita',
    authorBranch: 'B.Des · 3rd Year',
    photoUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
    caption: 'Designed the official poster & merchandise branding for Campus Cultural Fest 2026 🎨✨',
    category: 'Design Showcase',
    location: 'Design Studio B',
    likes: 93,
    timeAgo: '14h ago',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Priya Nair',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
    authorBranch: 'B.Arch · 3rd Year',
    photoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
    caption: 'Golden hour light hitting the main quad courtyard today ✨📸',
    category: 'Photography',
    location: 'Main Lawn',
    likes: 79,
    timeAgo: '1d ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Siddharth Mehta',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Siddharth',
    authorBranch: 'B.Tech ME · 3rd Year',
    photoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
    caption: 'Inter-branch basketball finals tonight at 7 PM! Cheer for CSE & ECE! 🏀🔥',
    category: 'Sports Fest',
    location: 'Sports Complex',
    likes: 88,
    timeAgo: '1d ago',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  },
  {
    authorName: 'Devansh Gupta',
    authorPhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Devansh',
    authorBranch: 'B.Tech Robotics · 4th Year',
    photoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    caption: 'Testing our autonomous campus delivery rover in the main corridor today! 🤖📦',
    category: 'Robotics Showcase',
    location: 'Robotics Lab',
    likes: 114,
    timeAgo: '2d ago',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

export async function GET(request) {
  try {
    if (!adminDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const batch = adminDb.batch();
    const postsRef = adminDb.collection('posts');

    for (const post of DEFAULT_MOCK_POSTS) {
      const docRef = postsRef.doc();
      batch.set(docRef, post);
    }

    await batch.commit();

    return NextResponse.json({ ok: true, message: 'Successfully seeded 10 mock posts to Firestore.' });
  } catch (err) {
    console.error('[GET /api/admin/seed-posts]', err.message);
    return NextResponse.json({ error: 'Failed to seed posts' }, { status: 500 });
  }
}
