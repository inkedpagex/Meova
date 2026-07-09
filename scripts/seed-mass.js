import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync(path.resolve('.env.local')));
const serviceAccount = {
  projectId: envConfig.FIREBASE_PROJECT_ID,
  clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
  privateKey: envConfig.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

const delay = ms => new Promise(res => setTimeout(res, ms));

const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Kabir', 'Rohan', 'Dhruv', 'Ananya', 'Diya', 'Ishita', 'Kavya', 'Meera', 'Neha', 'Priya', 'Riya', 'Sanya', 'Tara', 'John', 'Emma', 'Michael', 'Sarah', 'David', 'Jessica', 'James', 'Emily', 'Robert', 'Ashley'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Das', 'Roy', 'Chowdhury', 'Joshi', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const branches = ['B.Tech CSE', 'B.Tech ECE', 'B.Tech ME', 'BBA', 'BCA', 'B.Sc Physics', 'B.Sc Mathematics', 'MBA', 'MCA'];
const years = ['1st', '2nd', '3rd', '4th'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateName = () => `${getRandom(firstNames)} ${getRandom(lastNames)}`;

const MOCK_CIRCLES = [
  { id: 'c_gdsc', name: 'Google Developer Student Club', category: 'Coding & Tech', desc: 'The official GDSC chapter. We build cool stuff and learn together.', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80' },
  { id: 'c_music', name: 'Campus Symphony', category: 'Music & Bands', desc: 'For all musicians, singers, and music producers on campus. Jam sessions every weekend!', img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80' },
  { id: 'c_sports', name: 'Gladiators FC', category: 'Sports & Fitness', desc: 'The premier football club of the campus. Tryouts happen every semester.', img: 'https://images.unsplash.com/photo-1518605368461-1ee7a99652c2?w=500&q=80' },
  { id: 'c_photo', name: 'Lenscrafters', category: 'Photography & Film', desc: 'Capture the best moments on campus. Weekly photowalks and editing workshops.', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80' },
  { id: 'c_dance', name: 'Rhythm Raiders', category: 'Dance', desc: 'Hip-hop, contemporary, classical. We dance it all.', img: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=500&q=80' },
  { id: 'c_drama', name: 'Curtain Call', category: 'Theatre & Drama', desc: 'The official dramatics society. Street plays and stage performances.', img: 'https://images.unsplash.com/photo-1507676184212-d0c30a7bf241?w=500&q=80' },
  { id: 'c_lit', name: 'The Literary Society', category: 'Literature & Poetry', desc: 'Book discussions, poetry slams, and creative writing sessions.', img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&q=80' },
  { id: 'c_entre', name: 'E-Cell', category: 'Entrepreneurship', desc: 'Build your startup from scratch. Pitch days and investor meetups.', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&q=80' },
  { id: 'c_gaming', name: 'Nexus Gaming', category: 'Gaming & E-sports', desc: 'Valorant, CS:GO, FIFA tournaments and casual gaming nights.', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80' },
  { id: 'c_art', name: 'Palette', category: 'Art & Sketching', desc: 'Express yourself through colors and canvas.', img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500&q=80' },
  { id: 'c_astro', name: 'Stargazers', category: 'Astronomy & Science', desc: 'Late night telescope sessions and cosmic discussions.', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80' },
  { id: 'c_fashion', name: 'Vogue Campus', category: 'Fashion & Styling', desc: 'Trends, styling workshops, and the annual fashion show.', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80' },
  { id: 'c_social', name: 'Helping Hands', category: 'Volunteering & Social Service', desc: 'Give back to the community through regular outreach drives.', img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&q=80' },
  { id: 'c_debate', name: 'The Debating Society', category: 'Public Speaking & Debating', desc: 'Master the art of persuasion. Model UN and parliamentary debates.', img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&q=80' },
  { id: 'c_anime', name: 'Otaku Club', category: 'Anime & Manga', desc: 'Watch parties, manga discussions, and cosplay events.', img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80' }
];

const MOCK_EVENTS = [
  { title: 'Intro to Web3 & Blockchain', c_id: 'c_gdsc', loc: 'Block 4, Lab 2' },
  { title: 'React.js Crash Course', c_id: 'c_gdsc', loc: 'Main Auditorium' },
  { title: 'Acoustic Night Under The Stars', c_id: 'c_music', loc: 'Central Lawn' },
  { title: 'Battle of the Bands Auditions', c_id: 'c_music', loc: 'Music Room' },
  { title: 'Inter-College Football Tournament', c_id: 'c_sports', loc: 'Main Ground' },
  { title: 'Fitness Bootcamp', c_id: 'c_sports', loc: 'Gymnasium' },
  { title: 'Campus Photowalk', c_id: 'c_photo', loc: 'Main Gate' },
  { title: 'Lightroom Editing Masterclass', c_id: 'c_photo', loc: 'Media Lab' },
  { title: 'Hip-Hop Workshop', c_id: 'c_dance', loc: 'Dance Studio' },
  { title: 'Annual Dance Showcase', c_id: 'c_dance', loc: 'Main Auditorium' },
  { title: 'Street Play Rehearsals', c_id: 'c_drama', loc: 'OAT' },
  { title: 'Poetry Slam Vol. 3', c_id: 'c_lit', loc: 'Library AV Room' },
  { title: 'Startup Pitch Day', c_id: 'c_entre', loc: 'Incubation Center' },
  { title: 'Valorant Campus Cup', c_id: 'c_gaming', loc: 'Computer Center' },
  { title: 'Watercolors Workshop', c_id: 'c_art', loc: 'Art Studio' },
  { title: 'Meteor Shower Watch Party', c_id: 'c_astro', loc: 'Rooftop Observatory' },
  { title: 'Winter Collection Fashion Show', c_id: 'c_fashion', loc: 'Central Lawn' },
  { title: 'Orphanage Visit Drive', c_id: 'c_social', loc: 'Main Gate' },
  { title: 'Mock Parliament Debate', c_id: 'c_debate', loc: 'Seminar Hall' },
  { title: 'Anime Watch Party: Attack on Titan', c_id: 'c_anime', loc: 'AV Room' }
];

async function seed() {
  console.log('🚀 Starting massive database seed...');

  // 1. Clear existing data
  const collections = ['users', 'circles', 'events'];
  for (const c of collections) {
    const snapshot = await db.collection(c).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`🗑️ Cleared collection: ${c}`);
  }

  // 2. Create 100 Users
  console.log('👥 Generating 100 users...');
  const users = [];
  const batchUsers = db.batch();
  for (let i = 1; i <= 100; i++) {
    const userId = `user_${i}`;
    const user = {
      id: userId,
      email: `student${i}@university.edu`,
      full_name: generateName(),
      year: getRandom(years),
      branch: getRandom(branches),
      interests: [getRandom(MOCK_CIRCLES).category, getRandom(MOCK_CIRCLES).category],
      created_at: new Date().toISOString()
    };
    users.push(user);
    batchUsers.set(db.collection('users').doc(userId), user);
  }
  await batchUsers.commit();

  // 3. Create 15 Circles
  console.log('⭕ Generating 15 circles...');
  const circles = [];
  const batchCircles = db.batch();
  for (const mc of MOCK_CIRCLES) {
    // Pick 5-30 random members for each circle
    const memberCount = Math.floor(Math.random() * 25) + 5;
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const members = shuffledUsers.slice(0, memberCount).map(u => ({
      user_id: u.id,
      full_name: u.full_name,
      year: u.year,
      branch: u.branch,
      joined_at: new Date().toISOString()
    }));

    const circle = {
      id: mc.id,
      name: mc.name,
      category: mc.category,
      description: mc.desc,
      image_url: mc.img,
      member_count: memberCount,
      circle_members: members,
      created_at: new Date().toISOString()
    };
    circles.push(circle);
    batchCircles.set(db.collection('circles').doc(mc.id), circle);
  }
  await batchCircles.commit();

  // 4. Create 30 Events
  console.log('📅 Generating 30 events...');
  const batchEvents = db.batch();
  for (let i = 0; i < 30; i++) {
    const baseEvent = getRandom(MOCK_EVENTS);
    const circle = circles.find(c => c.id === baseEvent.c_id);
    
    // Pick 10-40 random RSVPs from circle members or random users
    const rsvpCount = Math.floor(Math.random() * 30) + 10;
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const rsvps = shuffledUsers.slice(0, rsvpCount).map(u => ({
      user_id: u.id,
      created_at: new Date().toISOString()
    }));

    // Random date between tomorrow and 30 days from now
    const randomDays = Math.floor(Math.random() * 30) + 1;
    const eventDate = new Date(Date.now() + 86400000 * randomDays).toISOString();

    const event = {
      id: `event_${i}`,
      circle_id: circle.id,
      circle_name: circle.name,
      title: baseEvent.title,
      description: `Join us for an amazing time at ${baseEvent.title}. Organized by ${circle.name}.`,
      date: eventDate,
      location: baseEvent.loc,
      rsvps_list: rsvps,
      created_at: new Date().toISOString()
    };
    batchEvents.set(db.collection('events').doc(event.id), event);
  }
  await batchEvents.commit();

  console.log('✅ Massive Seed Complete! 100 users, 15 circles, 30 events, thousands of interactions.');
  process.exit(0);
}

seed().catch(console.error);
