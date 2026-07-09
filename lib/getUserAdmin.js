import { cookies } from 'next/headers';
import { adminAuth, isFirebaseAdminConfigured } from './firebaseAdmin';

export async function getUserAdmin() {
  if (!isFirebaseAdminConfigured || !adminAuth) return null;
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__meetify_session')?.value;
  if (!sessionCookie) return null;

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { id: decodedToken.uid, ...decodedToken };
  } catch (err) {
    return null;
  }
}
