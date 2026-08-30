import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEFAULT_MOCK_POSTS = [
  {
    author_name: 'Aarav Sharma',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav',
    author_branch: 'B.Tech CSE · 3rd Year',
    media_urls: ['https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80'],
    content: 'Finished redesigning the GLA Tech Fest dashboard UI mockups! Feedback is welcome 🚀✨',
    category: 'UI/UX Work',
    location: 'Innovation Lab',
    likes_count: 24,
    is_hidden: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Ananya Roy',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya',
    author_branch: 'MBA · 1st Year',
    media_urls: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'],
    content: 'Post-lecture iced matcha @ Central Library Cafe ☕ who is up for a quick study break?',
    category: 'Campus Vibes',
    location: 'Central Cafe',
    likes_count: 42,
    is_hidden: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Rohan Verma',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan',
    author_branch: 'B.Tech ECE · 2nd Year',
    media_urls: ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'],
    content: 'Building real-time peer matching algorithms for Meetuply! Exciting updates coming soon 💻🔥',
    category: 'Project Showcase',
    location: 'Library Quiet Zone',
    likes_count: 38,
    is_hidden: false,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Kavya Patel',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kavya',
    author_branch: 'B.Des · 2nd Year',
    media_urls: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'],
    content: 'Jamming at the open-air amphitheater for tomorrow acoustic night! Come vibe with us 🎸🎤',
    category: 'Campus Event',
    location: 'Amphitheater',
    likes_count: 56,
    is_hidden: false,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Tanya Deshmukh',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tanya',
    author_branch: 'B.Tech IT · 3rd Year',
    media_urls: ['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80'],
    content: 'Just deployed our open-source student notes aggregator app for campus! DM for contributor access 🚀⚡',
    category: 'Dev Showcase',
    location: 'Tech Hub 3',
    likes_count: 67,
    is_hidden: false,
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Vikram Singh',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Vikram',
    author_branch: 'B.Tech AI · 4th Year',
    media_urls: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80'],
    content: '3AM energy drinks & final pitch deck prep for HackCampus 2026! 🏆🔥',
    category: 'Hackathon',
    location: 'Incubation Hub',
    likes_count: 61,
    is_hidden: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Ishita Sen',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ishita',
    author_branch: 'B.Des · 3rd Year',
    media_urls: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80'],
    content: 'Designed the official poster & merchandise branding for Campus Cultural Fest 2026 🎨✨',
    category: 'Design Showcase',
    location: 'Design Studio B',
    likes_count: 93,
    is_hidden: false,
    created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Priya Nair',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Priya',
    author_branch: 'B.Arch · 3rd Year',
    media_urls: ['https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80'],
    content: 'Golden hour light hitting the main quad courtyard today ✨📸',
    category: 'Photography',
    location: 'Main Lawn',
    likes_count: 79,
    is_hidden: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Siddharth Mehta',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Siddharth',
    author_branch: 'B.Tech ME · 3rd Year',
    media_urls: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80'],
    content: 'Inter-branch basketball finals tonight at 7 PM! Cheer for CSE & ECE! 🏀🔥',
    category: 'Sports Fest',
    location: 'Sports Complex',
    likes_count: 88,
    is_hidden: false,
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  },
  {
    author_name: 'Devansh Gupta',
    author_photo: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Devansh',
    author_branch: 'B.Tech Robotics · 4th Year',
    media_urls: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80'],
    content: 'Testing our autonomous campus delivery rover in the main corridor today! 🤖📦',
    category: 'Robotics Showcase',
    location: 'Robotics Lab',
    likes_count: 114,
    is_hidden: false,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from('posts')
      .insert(DEFAULT_MOCK_POSTS);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, message: 'Successfully seeded 10 mock posts to Supabase.' });
  } catch (err) {
    console.error('[GET /api/admin/seed-posts]', err.message);
    return NextResponse.json({ error: 'Failed to seed posts' }, { status: 500 });
  }
}
