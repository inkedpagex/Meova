import './globals.css';
import Sidebar from '../components/Sidebar';
import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
export const metadata = {
  title: 'meetifyy',
  description: 'Your campus life, all in one place.',
};

export default async function RootLayout({ children }) {
  let user = null;

  try {
    const fetchedUser = await getUserWithRole();
    if (fetchedUser) {
      try {
        const wallet = await getOrCreateWallet(fetchedUser.uid, fetchedUser.email);
        user = { ...fetchedUser, wallet };
      } catch {
        user = fetchedUser;
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

  try {
    return (
      <html lang="en" data-theme="light" style={{ colorScheme: 'light' }}>
        <head>
          <meta name="theme-color" content="#ffffff" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        </head>
        <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100dvh', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
          <div className="flex min-h-screen">
            <Sidebar user={user} />
            <div className="flex-1 md:pl-[220px] min-w-0">
              <main style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 88px', paddingTop: 68 }}
                className="md:!pt-8 md:!pb-8 md:px-6">
                {children}
              </main>
            </div>
          </div>
        </body>
      </html>
    );
  } catch (renderErr) {
    return (
      <html lang="en">
        <body style={{ background: '#000', color: 'red', padding: '20px', fontFamily: 'monospace' }}>
          <h1>Fatal RootLayout Rendering Error</h1>
          <pre>{renderErr?.message || String(renderErr)}</pre>
          <pre>{renderErr?.stack}</pre>
        </body>
      </html>
    );
  }
}
