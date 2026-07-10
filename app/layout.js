import './globals.css';
import Sidebar from '../components/Sidebar';
import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';

import { isFirebaseAdminConfigured, adminAuth } from '../lib/firebaseAdmin';

export const metadata = {
  title: 'meetuply',
  description: 'Your campus life, all in one place.',
};

export default async function RootLayout({ children }) {
  let user = null;

  try {
    if (isFirebaseAdminConfigured && adminAuth) {
      const fetchedUser = await getUserWithRole();
      if (fetchedUser) {
        try {
          const wallet = await getOrCreateWallet(fetchedUser.uid, fetchedUser.email);
          user = { ...fetchedUser, wallet };
        } catch {
          user = fetchedUser;
        }
      }
    }
    // Deep clone to remove any Firestore Timestamp classes or prototypes
    // This prevents Next.js serialization crashes when passing to Client Components
    if (user) {
      user = JSON.parse(JSON.stringify(user));
    }
  } catch (err) {
    // If it's a Next.js dynamic rendering error, rethrow it so Next.js handles it properly
    if (err?.message?.includes('Dynamic server usage') || err?.digest?.startsWith('NEXT_')) {
      throw err;
    }
    // Firebase Admin failed to initialize (bad env vars, missing key, etc.)
    // App renders as logged-out — do not crash.
    console.error('[RootLayout] Firebase Admin init error:', err?.message);
  }

  return (
    <html lang="en">
      <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100dvh' }}>
        <div className="flex min-h-screen">
          <Sidebar user={user} />

          {/* Main content offset for sidebar (desktop) / top+bottom bar (mobile) */}
          <div className="flex-1 md:pl-[220px] min-w-0">
            <main
              style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px', paddingTop: 72 }}
              className="md:!pt-8 md:!pb-8 md:px-8"
            >
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
