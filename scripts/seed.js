import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local manually for the script
const envConfig = dotenv.parse(fs.readFileSync(path.resolve('.env.local')));

const serviceAccount = {
  projectId: envConfig.FIREBASE_PROJECT_ID,
  clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
  privateKey: envConfig.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const seedData = async () => {
  console.log('🌱 Seeding Firebase Database with sample data...');

  const circles = [
    {
      id: 'circle_tech',
      name: 'Google Developer Student Club',
      category: 'Coding & Tech',
      description: 'The official GDSC chapter at the University. We build cool stuff and learn together.',
      image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
      whatsapp_link: 'https://chat.whatsapp.com/sample',
      created_at: new Date().toISOString()
    },
    {
      id: 'circle_music',
      name: 'Campus Symphony',
      category: 'Music & Bands',
      description: 'For all musicians, singers, and music producers on campus. Jam sessions every weekend!',
      image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80',
      created_at: new Date().toISOString()
    },
    {
      id: 'circle_sports',
      name: 'Gladiators FC',
      category: 'Sports & Fitness',
      description: 'The premier football club of the campus. Tryouts happen every semester.',
      image_url: 'https://images.unsplash.com/photo-1518605368461-1ee7a99652c2?w=500&q=80',
      created_at: new Date().toISOString()
    }
  ];

  const events = [
    {
      id: 'event_1',
      circle_id: 'circle_tech',
      title: 'Intro to Web3 & Blockchain',
      description: 'Join us for a hands-on session building your first smart contract.',
      date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      location: 'Block 4, Lab 2',
      created_at: new Date().toISOString()
    },
    {
      id: 'event_2',
      circle_id: 'circle_music',
      title: 'Acoustic Night Under The Stars',
      description: 'Bring your guitars and good vibes. Open mic for all.',
      date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
      location: 'Central Lawn',
      created_at: new Date().toISOString()
    },
    {
      id: 'event_3',
      circle_id: 'circle_tech',
      title: 'Hackathon Info Session',
      description: 'Everything you need to know about the upcoming 48-hour hackathon.',
      date: new Date(Date.now() + 86400000 * 7).toISOString(),
      location: 'Main Auditorium',
      created_at: new Date().toISOString()
    }
  ];

  try {
    for (const circle of circles) {
      await db.collection('circles').doc(circle.id).set(circle);
    }
    console.log('✅ Added 3 Circles');

    for (const event of events) {
      await db.collection('events').doc(event.id).set(event);
    }
    console.log('✅ Added 3 Events');

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
