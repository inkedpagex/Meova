// LocalStorage-backed client-side Mock Database for Meetify Experiences.
// Prevents firebase-admin crashes on Serverless SSR.
// Fully reactive in the browser, initialised with high-fidelity campus data.

const APPROVED_LOCATIONS = [
  "Library Central Hall 📚",
  "Student Union Lounge 🛋️",
  "Block 3 Open Amphitheatre 🎭",
  "Tech Hub Cafeteria ☕",
  "Central Lawn Sports Arena 🏸",
  "Startup Incubator Lab 🚀",
  "Design Studio Loft 🎨",
  "Campus Lake Gazebo 🚶"
];

const CATEGORIES = [
  { name: 'Coffee Connect ☕', value: 'Coffee' },
  { name: 'Study Together 📚', value: 'Study' },
  { name: 'Startup Discussion 🚀', value: 'Startup' },
  { name: 'Photography Walk 📷', value: 'Photography' },
  { name: 'Campus Walk 🚶', value: 'Walk' },
  { name: 'Badminton Match 🏸', value: 'Sports' },
  { name: 'Chess Match ♟', value: 'Gaming' },
  { name: 'Language Exchange 🌍', value: 'Language' },
  { name: 'Portfolio Review 💻', value: 'Coding' },
  { name: 'Design Review 🎨', value: 'Design' },
  { name: 'AI Discussion 🤖', value: 'AI' },
  { name: 'Music Jam 🎵', value: 'Music' }
];

const INITIAL_USERS = [
  {
    id: 'chirag',
    uid: 'chirag',
    full_name: 'Chirag Chak',
    email: 'chirag@example.com',
    branch: 'CSE',
    year: '4th',
    interests: ['Coding & Tech', 'Web Development', 'Design'],
    bio: 'Developing creative web platforms. Let\'s collaborate and build cool things!',
    role: 'host',
    isHost: true,
    instagram: 'chir_ag897',
    badges: ['Verified Host', 'Top Host', 'Campus Creator'],
    rating: 5.0,
    reviewsCount: 42,
    responseTime: 'usually replies in 2 minutes',
    acceptanceRate: '100%',
    completionRate: '100%',
    cancellationRate: '0%'
  },
  {
    id: 'aarav',
    uid: 'aarav',
    full_name: 'Aarav Sharma',
    email: 'aarav@example.com',
    branch: 'CSE',
    year: '3rd',
    interests: ['Coding & Tech', 'Entrepreneurship', 'Coffee'],
    bio: 'Building Next-gen campus tools. Let\'s co-work on tech projects!',
    role: 'host',
    isHost: true,
    instagram: 'aarav_sharma',
    badges: ['Verified Host', 'Top Host', 'Campus Creator'],
    rating: 4.9,
    reviewsCount: 38,
    responseTime: 'usually replies in 10 minutes',
    acceptanceRate: '95%',
    completionRate: '98%',
    cancellationRate: '2%'
  },
  {
    id: 'neha',
    uid: 'neha',
    full_name: 'Neha Verma',
    email: 'neha@example.com',
    branch: 'Design',
    year: '2nd',
    interests: ['Art & Sketching', 'Coding & Tech', 'Figma'],
    bio: 'UI/UX enthusiast. Let\'s review portfolio designs together.',
    role: 'host',
    isHost: true,
    instagram: 'neha_v',
    badges: ['Verified Host'],
    rating: 4.7,
    reviewsCount: 14,
    responseTime: 'usually replies in 1 hour',
    acceptanceRate: '90%',
    completionRate: '92%',
    cancellationRate: '4%'
  },
  {
    id: 'priya',
    uid: 'priya',
    full_name: 'Priya Patel',
    email: 'priya@example.com',
    branch: 'ECE',
    year: '4th',
    interests: ['Music & Bands', 'Literature & Poetry', 'Guitar'],
    bio: 'Acoustic jam partner. Happy to co-study or discuss creative writing!',
    role: 'host',
    isHost: true,
    instagram: 'priya_p',
    badges: ['Verified Host', 'Top Host'],
    rating: 4.8,
    reviewsCount: 22,
    responseTime: 'usually replies in 5 minutes',
    acceptanceRate: '98%',
    completionRate: '100%',
    cancellationRate: '0%'
  },
  {
    id: 'ananya',
    uid: 'ananya',
    full_name: 'Ananya Kapoor',
    email: 'ananya@example.com',
    branch: 'Biotech',
    year: '3rd',
    interests: ['Literature & Poetry', 'Art & Sketching', 'Books'],
    bio: 'Avid reader & digital artist. Book my cabin for a quiet study session or creative feedback.',
    role: 'host',
    isHost: true,
    instagram: 'ananya_kapoor',
    badges: ['Verified Host'],
    rating: 4.9,
    reviewsCount: 18,
    responseTime: 'usually replies in 15 minutes',
    acceptanceRate: '89%',
    completionRate: '95%',
    cancellationRate: '3%'
  },
  {
    id: 'riya',
    uid: 'riya',
    full_name: 'Riya Sen',
    email: 'riya@example.com',
    branch: 'CSE',
    year: '1st',
    interests: ['Coding & Tech', 'Gaming & E-sports', 'Retro Games'],
    bio: 'Passionate about cybersecurity and retro arcade gaming. Let\'s study web development or discuss game dev!',
    role: 'user',
    isHost: false,
    rating: 4.5,
    reviewsCount: 3,
    responseTime: 'usually replies in 2 hours'
  },
  {
    id: 'isha',
    uid: 'isha',
    full_name: 'Isha Sharma',
    email: 'isha@example.com',
    branch: 'Management',
    year: '2nd',
    interests: ['Entrepreneurship', 'Photography & Film', 'Product'],
    bio: 'Aspiring startup founder. Let\'s exchange product ideas and work on marketing case studies!',
    role: 'user',
    isHost: false,
    rating: 4.6,
    reviewsCount: 5,
    responseTime: 'usually replies in 30 minutes'
  },
  {
    id: 'sneha',
    uid: 'sneha',
    full_name: 'Sneha Reddy',
    email: 'sneha@example.com',
    branch: 'Design',
    year: '3rd',
    interests: ['Art & Sketching', 'Photography & Film', 'Style'],
    bio: 'Fashion designer & street photographer. Book a slot at my workspace cabin for brainstorming and creative work.',
    role: 'user',
    isHost: false,
    rating: 4.4,
    reviewsCount: 2,
    responseTime: 'usually replies in 4 hours'
  }
];

const INITIAL_EXPERIENCES = [
  {
    id: 'exp_6',
    title: 'Advanced Web Dev & Next.js Session',
    category: 'Startup',
    description: 'Let\'s collaborate on Next.js, building advanced web applications, or optimizing custom database architectures. Perfect for getting hands-on fullstack feedback!',
    location: 'Startup Incubator Lab 🚀',
    price: 300,
    duration: 60,
    days: ['Monday', 'Thursday'],
    slots: ['2:00 PM', '4:00 PM'],
    maxBookings: 1,
    hostId: 'chirag',
    rating: 5.0,
    reviewsCount: 24,
    img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    tags: ['Next.js', 'React', 'Startup', 'Fullstack']
  },
  {
    id: 'exp_1',
    title: 'Tech & Coffee Brainstorm',
    category: 'Coffee',
    description: 'Let\'s grab a brew and discuss tech stacks, startup MVPs, or cool side-projects. Happy to give feedback on your web-app architecture or help debug code over a coffee connect!',
    location: 'Tech Hub Cafeteria ☕',
    price: 250,
    duration: 45, // mins
    days: ['Monday', 'Wednesday'],
    slots: ['4:00 PM', '5:00 PM'],
    maxBookings: 1,
    hostId: 'aarav',
    rating: 4.9,
    reviewsCount: 28,
    img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    tags: ['Coffee', 'Startup', 'Coding']
  },
  {
    id: 'exp_2',
    title: 'Acoustic Jam & Music Chat',
    category: 'Music',
    description: 'Bring your guitar, ukelele, or just your voice. Let\'s jam to some indie pop or acoustic hits on the lawn. Open discussion about music production and songwriting tips.',
    location: 'Block 3 Open Amphitheatre 🎭',
    price: 250,
    duration: 60,
    days: ['Tuesday', 'Friday'],
    slots: ['5:00 PM', '6:00 PM'],
    maxBookings: 1,
    hostId: 'priya',
    rating: 4.8,
    reviewsCount: 16,
    img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
    tags: ['Music', 'Guitar', 'Creative']
  },
  {
    id: 'exp_3',
    title: 'Figma Portfolio Roast & Review',
    category: 'Design',
    description: 'Looking for a critique on your UI/UX case study or Figma mockup files? Let\'s sit down, outline your typography and layout rules, and optimize your design to make it look professional.',
    location: 'Design Studio Loft 🎨',
    price: 500,
    duration: 30,
    days: ['Monday', 'Friday'],
    slots: ['4:00 PM', '6:00 PM'],
    maxBookings: 1,
    hostId: 'neha',
    rating: 4.7,
    reviewsCount: 9,
    img: 'https://images.unsplash.com/photo-1581291518655-9523c932ded7?w=800&q=80',
    tags: ['Design', 'Figma', 'UX Portfolio']
  },
  {
    id: 'exp_4',
    title: 'Biotech & Science Focus Study',
    category: 'Study',
    description: 'Focused co-studying session. Great for exam prep, thesis review, or sharing notes in biotech, general science, and writing. We will study in silence for 45 mins then discuss for 15 mins.',
    location: 'Library Central Hall 📚',
    price: 150,
    duration: 60,
    days: ['Tuesday', 'Thursday'],
    slots: ['3:00 PM', '4:00 PM'],
    maxBookings: 1,
    hostId: 'ananya',
    rating: 4.9,
    reviewsCount: 12,
    img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
    tags: ['Study', 'Focus', 'Silent Co-working']
  },
  {
    id: 'exp_5',
    title: 'Golden Hour Photography Walk',
    category: 'Photography',
    description: 'Let\'s explore hidden aesthetic spots on campus during sunset. We will learn framing, lighting adjustments, and editing workflows. Perfect for phone photographers or DSLR owners!',
    location: 'Campus Lake Gazebo 🚶',
    price: 500,
    duration: 60,
    days: ['Wednesday', 'Friday'],
    slots: ['5:30 PM'],
    maxBookings: 1,
    hostId: 'aarav',
    rating: 5.0,
    reviewsCount: 8,
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    tags: ['Photography', 'Campus Vibe', 'Walk']
  }
];

const INITIAL_REVIEWS = [
  {
    id: 'rev_1',
    experienceId: 'exp_1',
    hostId: 'aarav',
    authorName: 'Riya Sen',
    authorAvatar: 'Riya Sen',
    rating: 5,
    written: 'Aarav helped me resolve a tricky React hydration error. Super chill conversation and really nice coffee recommendations!',
    categories: ['Friendly', 'Interesting Conversation', 'Punctual'],
    date: '2026-07-10'
  },
  {
    id: 'rev_2',
    experienceId: 'exp_2',
    hostId: 'priya',
    authorName: 'Aarav Sharma',
    authorAvatar: 'Aarav Sharma',
    rating: 5,
    written: 'Had an amazing jam session! Priya is extremely talented and friendly. Would highly recommend joining her sessions.',
    categories: ['Friendly', 'Interesting Conversation', 'Would Meet Again'],
    date: '2026-07-12'
  }
];

// LocalStorage Helper
function getStore(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(`meetify_db_${key}`);
  if (val === null) {
    localStorage.setItem(`meetify_db_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    let parsed = JSON.parse(val);
    // Auto-migrate: if key is 'users' and some default user has instagram not present in parsed, merge it.
    if (key === 'users' && Array.isArray(parsed)) {
      let migrated = false;
      parsed = parsed.map(pu => {
        const du = defaultValue.find(d => d.id === pu.id);
        if (du && du.instagram && !pu.instagram) {
          migrated = true;
          return { ...pu, instagram: du.instagram };
        }
        return pu;
      });
      
      // Append missing users (e.g. newly added Chirag profile)
      defaultValue.forEach(du => {
        if (!parsed.some(pu => pu.id === du.id)) {
          parsed.push(du);
          migrated = true;
        }
      });

      if (migrated) {
        localStorage.setItem(`meetify_db_${key}`, JSON.stringify(parsed));
      }
    }
    
    // Auto-migrate: if key is 'experiences'
    if (key === 'experiences' && Array.isArray(parsed)) {
      let migrated = false;
      defaultValue.forEach(de => {
        if (!parsed.some(pe => pe.id === de.id)) {
          parsed.push(de);
          migrated = true;
        }
      });
      if (migrated) {
        localStorage.setItem(`meetify_db_${key}`, JSON.stringify(parsed));
      }
    }
    return parsed;
  } catch (e) {
    return defaultValue;
  }
}

function setStore(key, data) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`meetify_db_${key}`, JSON.stringify(data));
  }
}

// Exportable Database Actions
export const mockDb = {
  getUsers: () => getStore('users', INITIAL_USERS),
  getUser: (uid) => {
    const users = getStore('users', INITIAL_USERS);
    return users.find(u => u.id === uid || u.uid === uid) || null;
  },
  updateUser: (uid, updates) => {
    const users = getStore('users', INITIAL_USERS);
    const updated = users.map(u => (u.id === uid || u.uid === uid) ? { ...u, ...updates } : u);
    setStore('users', updated);
    return true;
  },

  getExperiences: () => getStore('experiences', INITIAL_EXPERIENCES),
  getExperience: (id) => {
    const exps = getStore('experiences', INITIAL_EXPERIENCES);
    return exps.find(e => e.id === id) || null;
  },
  createExperience: (exp) => {
    const exps = getStore('experiences', INITIAL_EXPERIENCES);
    const newExp = {
      id: `exp_${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      img: exp.img || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80',
      ...exp
    };
    exps.push(newExp);
    setStore('experiences', exps);
    return newExp;
  },

  getBookings: () => getStore('bookings', []),
  createBooking: (booking) => {
    const bookings = getStore('bookings', []);
    const newBooking = {
      id: `bk_${Date.now()}`,
      status: 'Requested',
      created_at: new Date().toISOString(),
      meetingCode: String(Math.floor(100000 + Math.random() * 900000)), // 6 digit
      ...booking
    };
    bookings.push(newBooking);
    setStore('bookings', bookings);
    
    // Deduct from guest wallet immediately into escrow
    const guestWallet = mockDb.getWallet(booking.guestId);
    const price = parseInt(booking.price, 10) || 0;
    
    let purchasedDeduct = Math.min(guestWallet.purchased, price);
    let remaining = price - purchasedDeduct;
    let bonusDeduct = Math.min(guestWallet.bonus, remaining);
    remaining = remaining - bonusDeduct;
    let creatorDeduct = Math.min(guestWallet.creator, remaining);
    
    guestWallet.purchased -= purchasedDeduct;
    guestWallet.bonus -= bonusDeduct;
    guestWallet.creator -= creatorDeduct;
    mockDb.saveWallet(booking.guestId, guestWallet);

    // Save transaction
    mockDb.addTransaction(booking.guestId, {
      type: 'event_booking',
      amount: -price,
      metadata: { bookingId: newBooking.id, title: booking.title }
    });

    // Create notifications
    mockDb.createNotification(booking.hostId, {
      title: 'New Booking Request ⚡',
      body: `${booking.guestName} requested to join "${booking.title}"`,
      type: 'request',
      bookingId: newBooking.id
    });

    return newBooking;
  },

  updateBookingStatus: (bookingId, status, rescheduleData = null) => {
    const bookings = getStore('bookings', []);
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return null;
    
    const booking = bookings[bookingIndex];
    booking.status = status;
    
    if (status === 'Confirmed' && rescheduleData) {
      booking.date = rescheduleData.date;
      booking.time = rescheduleData.time;
    }
    
    bookings[bookingIndex] = booking;
    setStore('bookings', bookings);

    // Notification trigger
    if (status === 'Confirmed') {
      mockDb.createNotification(booking.guestId, {
        title: 'Booking Accepted! 🎉',
        body: `${booking.hostName} accepted "${booking.title}". QR code is ready.`,
        type: 'accepted',
        bookingId
      });
    } else if (status === 'Rejected') {
      // Refund sparks back to guest
      const guestWallet = mockDb.getWallet(booking.guestId);
      guestWallet.purchased += booking.price;
      mockDb.saveWallet(booking.guestId, guestWallet);

      mockDb.addTransaction(booking.guestId, {
        type: 'refund',
        amount: booking.price,
        metadata: { bookingId, reason: 'Host rejected booking' }
      });

      mockDb.createNotification(booking.guestId, {
        title: 'Booking Rejected 😞',
        body: `Your booking for "${booking.title}" was declined. Sparks have been refunded.`,
        type: 'rejected',
        bookingId
      });
    }

    return booking;
  },

  completeMeeting: (bookingId, inputCode) => {
    const bookings = getStore('bookings', []);
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return { success: false, error: 'Booking not found' };

    const booking = bookings[idx];
    if (booking.meetingCode !== inputCode) {
      return { success: false, error: 'Incorrect meeting confirmation code.' };
    }

    booking.status = 'Meeting Completed';
    bookings[idx] = booking;
    setStore('bookings', bookings);

    // Releases Escrow and splits: 90% Host Creator Earnings, 10% Platform Commission
    const hostId = booking.hostId;
    const price = booking.price;
    const hostShare = Math.floor(price * 0.9);
    const commission = price - hostShare;

    const hostWallet = mockDb.getWallet(hostId);
    hostWallet.creator += hostShare;
    hostWallet.lifetime_earned += hostShare;
    mockDb.saveWallet(hostId, hostWallet);

    // Record host transaction
    mockDb.addTransaction(hostId, {
      type: 'creator_earnings',
      amount: hostShare,
      metadata: { bookingId, reason: `Hosted "${booking.title}"` }
    });

    // Notify guest & host reviews are open
    mockDb.createNotification(booking.guestId, {
      title: 'Meeting Verified! 🤝',
      body: `Meeting complete. Please leave a review for ${booking.hostName}.`,
      type: 'review_prompt',
      bookingId
    });

    mockDb.createNotification(hostId, {
      title: 'Earnings Released! ⚡',
      body: `Verified! ${hostShare} Sparks added to your Creator Earnings.`,
      type: 'payout',
      bookingId
    });

    // Increment host total hosted experiences
    const host = mockDb.getUser(hostId);
    if (host) {
      host.reviewsCount = (host.reviewsCount || 0) + 1;
      mockDb.updateUser(hostId, host);
    }

    return { success: true, booking };
  },

  cancelBooking: (bookingId, cancelledBy) => {
    const bookings = getStore('bookings', []);
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;

    const booking = bookings[idx];
    booking.status = 'Canceled';
    bookings[idx] = booking;
    setStore('bookings', bookings);

    // Cancel refund policy logic
    if (cancelledBy === 'host') {
      // Full refund
      const guestWallet = mockDb.getWallet(booking.guestId);
      guestWallet.purchased += booking.price;
      mockDb.saveWallet(booking.guestId, guestWallet);

      mockDb.addTransaction(booking.guestId, {
        type: 'refund',
        amount: booking.price,
        metadata: { bookingId, reason: 'Cancelled by Host' }
      });

      mockDb.createNotification(booking.guestId, {
        title: 'Booking Cancelled by Host ⚠️',
        body: `"${booking.title}" was cancelled. Full refund issued.`,
        type: 'cancelled',
        bookingId
      });
    } else {
      // Guest cancelled - Refund 100% since it's campus (could add window checks later)
      const guestWallet = mockDb.getWallet(booking.guestId);
      guestWallet.purchased += booking.price;
      mockDb.saveWallet(booking.guestId, guestWallet);

      mockDb.addTransaction(booking.guestId, {
        type: 'refund',
        amount: booking.price,
        metadata: { bookingId, reason: 'Cancelled by you' }
      });

      mockDb.createNotification(booking.hostId, {
        title: 'Booking Cancelled by Guest ⚠️',
        body: `${booking.guestName} cancelled their booking for "${booking.title}".`,
        type: 'cancelled',
        bookingId
      });
    }

    return true;
  },

  getWallet: (uid) => {
    const wallets = getStore('wallets', {});
    if (!wallets[uid]) {
      wallets[uid] = {
        userId: uid,
        purchased: 500, // Default signup sparks
        bonus: 50,
        creator: 0,
        lifetime_purchased: 500,
        lifetime_earned: 0,
        lifetime_withdrawn: 0
      };
      setStore('wallets', wallets);
    }
    return wallets[uid];
  },
  saveWallet: (uid, wallet) => {
    const wallets = getStore('wallets', {});
    wallets[uid] = wallet;
    setStore('wallets', wallets);
  },

  getTransactions: (uid) => {
    const txs = getStore('transactions', []);
    return txs.filter(t => t.userId === uid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },
  addTransaction: (uid, tx) => {
    const txs = getStore('transactions', []);
    txs.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: uid,
      created_at: new Date().toISOString(),
      ...tx
    });
    setStore('transactions', txs);
  },

  getWithdrawals: (uid) => {
    const wds = getStore('withdrawals', []);
    return wds.filter(w => w.userId === uid);
  },
  createWithdrawal: (uid, amount, method, details) => {
    const wds = getStore('withdrawals', []);
    const wallet = mockDb.getWallet(uid);
    if (wallet.creator < amount) return null;
    
    wallet.creator -= amount;
    wallet.lifetime_withdrawn += amount;
    mockDb.saveWallet(uid, wallet);

    const wd = {
      id: `wd_${Date.now()}`,
      userId: uid,
      email: mockDb.getUser(uid)?.email || 'user@example.com',
      amount,
      method,
      details,
      status: 'pending',
      requested_at: new Date().toISOString()
    };
    wds.push(wd);
    setStore('withdrawals', wds);

    mockDb.addTransaction(uid, {
      type: 'withdrawal',
      amount: -amount,
      metadata: { withdrawalId: wd.id, method }
    });

    return wd;
  },

  getReviews: (hostId) => {
    const revs = getStore('reviews', INITIAL_REVIEWS);
    return revs.filter(r => r.hostId === hostId);
  },
  addReview: (review) => {
    const revs = getStore('reviews', INITIAL_REVIEWS);
    const newRev = {
      id: `rev_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...review
    };
    revs.push(newRev);
    setStore('reviews', revs);

    // Re-evaluate host rating
    const hostReviews = revs.filter(r => r.hostId === review.hostId);
    const avg = parseFloat((hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length).toFixed(1));
    const host = mockDb.getUser(review.hostId);
    if (host) {
      host.rating = avg;
      mockDb.updateUser(review.hostId, host);
    }

    return newRev;
  },

  getNotifications: (uid) => {
    const notifs = getStore('notifications', []);
    return notifs.filter(n => n.userId === uid).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },
  createNotification: (uid, notif) => {
    const notifs = getStore('notifications', []);
    notifs.push({
      id: `nt_${Date.now()}`,
      userId: uid,
      read: false,
      created_at: new Date().toISOString(),
      ...notif
    });
    setStore('notifications', notifs);
  },
  markNotificationsRead: (uid) => {
    const notifs = getStore('notifications', []);
    const updated = notifs.map(n => n.userId === uid ? { ...n, read: true } : n);
    setStore('notifications', updated);
  },

  getHostVerifications: () => getStore('hostVerifications', []),
  submitHostVerification: (uid, details) => {
    const reqs = getStore('hostVerifications', []);
    const existing = reqs.find(r => r.userId === uid);
    if (existing && existing.status === 'pending') return existing;

    const req = {
      id: `hv_${Date.now()}`,
      userId: uid,
      userName: details.userName,
      email: details.email,
      university: details.university || 'GLA University',
      govId: details.govId || '',
      status: 'pending',
      submitted_at: new Date().toISOString()
    };
    reqs.push(req);
    setStore('hostVerifications', reqs);
    return req;
  },
  approveHostVerification: (reqId, approve = true) => {
    const reqs = getStore('hostVerifications', []);
    const idx = reqs.findIndex(r => r.id === reqId);
    if (idx === -1) return false;

    const req = reqs[idx];
    req.status = approve ? 'approved' : 'rejected';
    reqs[idx] = req;
    setStore('hostVerifications', reqs);

    if (approve) {
      const user = mockDb.getUser(req.userId);
      if (user) {
        user.role = 'host';
        user.isHost = true;
        user.badges = Array.from(new Set([...(user.badges || []), 'Verified Host']));
        mockDb.updateUser(req.userId, user);
      }
      mockDb.createNotification(req.userId, {
        title: 'Host Account Approved! 🌟',
        body: 'You are now a Verified Host! You can start hosting experiences.',
        type: 'system'
      });
    }

    return true;
  },

  reportUser: (reportedId, reporterId, reason) => {
    const reports = getStore('reports', []);
    reports.push({
      id: `rep_${Date.now()}`,
      reportedId,
      reporterId,
      reason,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    setStore('reports', reports);
    return true;
  },

  getReports: () => getStore('reports', []),
  
  APPROVED_LOCATIONS,
  CATEGORIES
};
