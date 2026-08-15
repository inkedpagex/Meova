'use server';

import { adminDb, adminAuth } from '../../lib/firebaseAdmin';

export async function createProfileAdmin(idToken, profileData) {
  try {
    if (!adminDb || !adminAuth) {
      console.warn('[createProfileAdmin] Firebase Admin not initialized — profile not saved to Firestore.');
      return { success: true }; // Don't block signup
    }

    // Verify the token truly belongs to this user
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (uid !== profileData.id) {
      throw new Error('Unauthorized: Token UID does not match profile ID');
    }

    const docRef = adminDb.collection('users').doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      // New user — create full profile
      await docRef.set({
        id: uid,
        uid,
        email: decodedToken.email || profileData.email || '',
        full_name: profileData.full_name || decodedToken.name || '',
        photo_url: profileData.photo_url || decodedToken.picture || '',
        year: profileData.year || '1st',
        branch: profileData.branch || '',
        interests: profileData.interests || [],
        bio: profileData.bio || '',
        instagram: profileData.instagram || '',
        age: profileData.age || 20,
        lookingFor: profileData.lookingFor || '',
        studyStyle: profileData.studyStyle || '',
        isHost: profileData.isHost || false,
        role: 'user',
        created_at: new Date().toISOString(),
      });

      // Create their wallet document
      const walletRef = adminDb.collection('wallets').doc(uid);
      const walletSnap = await walletRef.get();
      if (!walletSnap.exists) {
        await walletRef.set({
          userId: uid,
          email: decodedToken.email || '',
          purchased: 0,
          bonus: 50, // Welcome bonus
          creator: 0,
          lifetime_purchased: 0,
          lifetime_earned: 0,
          lifetime_withdrawn: 0,
          updated_at: new Date().toISOString(),
        });

        // Log the welcome bonus transaction
        await adminDb.collection('transactions').add({
          userId: uid,
          type: 'bonus',
          amount: 50,
          description: 'Welcome bonus ⚡',
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
        });
      }
    } else {
      // Returning user — only update profile overrides (photo, interests etc.)
      const updates = {};
      if (profileData.photo_url) updates.photo_url = profileData.photo_url;
      if (profileData.full_name) updates.full_name = profileData.full_name;
      if (profileData.year) updates.year = profileData.year;
      if (profileData.branch) updates.branch = profileData.branch;
      if (profileData.interests?.length) updates.interests = profileData.interests;
      if (Object.keys(updates).length > 0) {
        await docRef.update(updates);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[createProfileAdmin] Error:', err.message);
    return { success: false, error: err.message };
  }
}
