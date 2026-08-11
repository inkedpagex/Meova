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

const INITIAL_USERS = [];

const INITIAL_EXPERIENCES = [];

const INITIAL_REVIEWS = [];

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
        let changed = false;
        const updates = {};
        
        const du = defaultValue.find(d => d.id === pu.id);
        if (du) {
          ['instagram', 'age', 'recentlyActive', 'photo_url'].forEach(field => {
            if (du[field] !== undefined && pu[field] !== du[field]) {
              updates[field] = du[field];
              changed = true;
            }
          });
        }
        
        if (pu.isIdOn === undefined) {
          updates.isIdOn = true;
          changed = true;
        }
        
        if (changed) {
          migrated = true;
          return { ...pu, ...updates };
        }
        return pu;
      });
      
      // Append missing users (e.g. newly added Chirag profile, Payal, etc.)
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
        const existingIdx = parsed.findIndex(pe => pe.id === de.id);
        if (existingIdx === -1) {
          parsed.push(de);
          migrated = true;
        } else {
          const existing = parsed[existingIdx];
          // Auto-correct any legacy typos or different image/title properties
          if (
            existing.title.includes('Fiama') || 
            existing.title !== de.title ||
            existing.img !== de.img
          ) {
            parsed[existingIdx] = { ...existing, ...de };
            migrated = true;
          }
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
    let found = false;
    const updated = users.map(u => {
      if (u.id === uid || u.uid === uid) {
        found = true;
        return { ...u, ...updates };
      }
      return u;
    });
    if (!found) {
      updated.push({
        id: uid,
        uid: uid,
        ...updates
      });
    }
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

  // ── PAYMENT REQUESTS (Buy Sparks Flow) ─────────────────────────────────────

  getPaymentRequests: () => getStore('payment_requests', []),

  getPaymentRequestsByUser: (uid) => {
    const reqs = getStore('payment_requests', []);
    return reqs.filter(r => r.userId === uid);
  },

  createPaymentRequest: (req) => {
    const reqs = getStore('payment_requests', []);
    // Block if user already has a pending request for same pack
    const existing = reqs.find(r => r.userId === req.userId && r.pack_key === req.pack_key && r.status === 'pending');
    if (existing) return { exists: true, request: existing };

    const newReq = {
      id: `pr_${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...req
    };
    reqs.push(newReq);
    setStore('payment_requests', reqs);
    return { exists: false, request: newReq };
  },

  approvePaymentRequest: (id) => {
    const reqs = getStore('payment_requests', []);
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) return false;

    const req = reqs[idx];
    if (req.status !== 'pending') return false;

    req.status = 'approved';
    req.approved_at = new Date().toISOString();
    reqs[idx] = req;
    setStore('payment_requests', reqs);

    // Credit user's wallet
    const wallet = mockDb.getWallet(req.userId);
    wallet.purchased += req.sparks;
    wallet.lifetime_purchased += req.sparks;
    mockDb.saveWallet(req.userId, wallet);

    // Add transaction record
    mockDb.addTransaction(req.userId, {
      type: 'purchase',
      amount: req.sparks,
      metadata: { pack_name: req.pack_name, ref: req.reference_code, amount_inr: req.amount_inr }
    });

    // Notify user
    mockDb.createNotification(req.userId, {
      title: 'Sparks Added! ⚡',
      body: `${req.sparks} Sparks from your ${req.pack_name} pack have been credited to your wallet.`,
      type: 'payout'
    });

    return true;
  },

  rejectPaymentRequest: (id) => {
    const reqs = getStore('payment_requests', []);
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) return false;

    reqs[idx].status = 'rejected';
    reqs[idx].rejected_at = new Date().toISOString();
    setStore('payment_requests', reqs);

    // Notify user
    mockDb.createNotification(reqs[idx].userId, {
      title: 'Payment Rejected',
      body: `Your ${reqs[idx].pack_name} pack payment could not be verified. Please contact support with ref: ${reqs[idx].reference_code}`,
      type: 'system'
    });

    return true;
  },

  // ── ADMIN: ALL WITHDRAWALS ──────────────────────────────────────────────────

  getAllWithdrawals: () => getStore('withdrawals', []),

  processWithdrawal: (wdId, approve) => {
    const wds = getStore('withdrawals', []);
    const idx = wds.findIndex(w => w.id === wdId);
    if (idx === -1) return false;

    const wd = wds[idx];
    wds[idx].status = approve ? 'paid' : 'rejected';
    wds[idx].processed_at = new Date().toISOString();
    setStore('withdrawals', wds);

    if (!approve) {
      // Refund the creator sparks back
      const wallet = mockDb.getWallet(wd.userId);
      wallet.creator += wd.amount;
      wallet.lifetime_withdrawn -= wd.amount;
      mockDb.saveWallet(wd.userId, wallet);

      mockDb.addTransaction(wd.userId, {
        type: 'refund',
        amount: wd.amount,
        metadata: { reason: 'Withdrawal rejected by admin', withdrawalId: wdId }
      });

      mockDb.createNotification(wd.userId, {
        title: 'Withdrawal Rejected',
        body: `Your withdrawal of ${wd.amount} Sparks was declined. Sparks refunded to your Creator Earnings.`,
        type: 'system'
      });
    } else {
      mockDb.createNotification(wd.userId, {
        title: 'Withdrawal Paid! 💰',
        body: `Your withdrawal of ${wd.amount} Sparks (≈ ₹${wd.amount}) has been processed via ${wd.method?.toUpperCase()}.`,
        type: 'payout'
      });
    }

    return true;
  },

  // ── ESCROW HELPER ───────────────────────────────────────────────────────────

  getEscrowAmount: (uid) => {
    const bookings = getStore('bookings', []);
    return bookings
      .filter(b => b.guestId === uid && ['Requested', 'Confirmed'].includes(b.status))
      .reduce((sum, b) => sum + (b.price || 0), 0);
  },

  // ── REFERRAL SYSTEM ─────────────────────────────────────────────────────────

  /**
   * Generates a unique referral code for a user.
   * Code format: first 5 chars of name (uppercase) + 4 random digits
   * e.g., "CHIRAG2948"
   */
  getUserReferralCode: (uid) => {
    const users = getStore('users', []);
    const user = users.find(u => u.id === uid || u.uid === uid);

    // Return existing code if already has one
    if (user?.referral_code) return user.referral_code;

    // Generate new unique code
    const nameSlug = (user?.full_name || user?.email || 'USER')
      .replace(/\s+/g, '')
      .toUpperCase()
      .slice(0, 5);
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `${nameSlug}${suffix}`;

    // Ensure code is truly unique
    const allUsers = getStore('users', []);
    const codeAlreadyUsed = allUsers.some(u => u.referral_code === code);
    const finalCode = codeAlreadyUsed ? `${nameSlug}${Math.floor(1000 + Math.random() * 9000)}` : code;

    // Save to user record
    mockDb.updateUser(uid, { referral_code: finalCode });
    return finalCode;
  },

  /**
   * Apply a referral code.
   * Security rules:
   * 1. newUser must be logged in and have a complete profile (name + branch + photo)
   * 2. Cannot use own referral code
   * 3. Can only use one referral code (referral_applied flag)
   * 4. Referrer gets +10 bonus sparks, new user gets +10 bonus sparks
   */
  useReferralCode: (code, newUserId) => {
    const allUsers = getStore('users', []);

    // Find new user
    const newUserIdx = allUsers.findIndex(u => u.id === newUserId || u.uid === newUserId);
    if (newUserIdx === -1) return { ok: false, error: 'User not found.' };

    const newUser = allUsers[newUserIdx];

    // Gate: profile must be complete (name + branch + photo)
    if (!newUser.full_name || !newUser.branch) {
      return { ok: false, error: 'Complete your profile (name, branch) before using a referral code.' };
    }
    if (!newUser.photo_url) {
      return { ok: false, error: 'Add a profile photo before using a referral code.' };
    }

    // Gate: already used a referral
    if (newUser.referral_applied) {
      return { ok: false, error: 'You have already used a referral code.' };
    }

    // Find referrer by code
    const referrerIdx = allUsers.findIndex(u => u.referral_code === code);
    if (referrerIdx === -1) {
      return { ok: false, error: 'Invalid referral code. Please check and try again.' };
    }

    const referrer = allUsers[referrerIdx];

    // Gate: cannot use own code
    if (referrer.id === newUserId || referrer.uid === newUserId) {
      return { ok: false, error: 'You cannot use your own referral code.' };
    }

    // Apply referral
    // Mark new user as having used a code
    allUsers[newUserIdx].referral_applied = true;
    allUsers[newUserIdx].referral_used_code = code;
    setStore('users', allUsers);

    // Credit +10 bonus to new user
    const newUserWallet = mockDb.getWallet(newUserId);
    newUserWallet.bonus += 10;
    mockDb.saveWallet(newUserId, newUserWallet);
    mockDb.addTransaction(newUserId, {
      type: 'bonus',
      amount: 10,
      metadata: { reason: `Referral bonus — used code ${code}` }
    });
    mockDb.createNotification(newUserId, {
      title: 'Referral Bonus! 🎉',
      body: `You received 10 bonus Sparks for joining via a referral code!`,
      type: 'payout'
    });

    // Credit +10 bonus to referrer
    const referrerId = referrer.id || referrer.uid;
    const referrerWallet = mockDb.getWallet(referrerId);
    referrerWallet.bonus += 10;
    mockDb.saveWallet(referrerId, referrerWallet);
    mockDb.addTransaction(referrerId, {
      type: 'bonus',
      amount: 10,
      metadata: { reason: `Referral bonus — ${newUser.full_name} joined using your code` }
    });
    mockDb.createNotification(referrerId, {
      title: 'Referral Success! ⚡',
      body: `${newUser.full_name} joined using your referral code. You earned 10 bonus Sparks!`,
      type: 'payout'
    });

    return { ok: true, message: 'Referral applied! You both received 10 bonus Sparks.' };
  },

  APPROVED_LOCATIONS,
  CATEGORIES
};

