import './globals.css';
import Sidebar from '../components/Sidebar';
import RightPanel from '../components/RightPanel';
import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin, fetchUpcomingEventsAdmin } from '../lib/firebaseAdminQueries';
import Script from 'next/script';
import GoogleAuthProviderWrapper from '../components/GoogleAuthProviderWrapper';
import { headers } from 'next/headers';
import { UserProvider } from '../components/providers/UserProvider';
import FCMInitializer from '../components/FCMInitializer';
import PWAInstallBanner from '../components/PWAInstallBanner';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import MainContentWrapper from '../components/MainContentWrapper';
import NetworkWrapper from '../components/NetworkWrapper';

export const metadata = {
  title: 'Meetuply — Your Campus Life',
  description: 'Join experiences, meet people, and grow your campus social circle with Meetuply.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meetuply',
  },
};

export default async function RootLayout({ children }) {
  let user = null;
  let people = [];
  let events = [];
  let isAdminPath = false;
  let isMessagesPath = false;

  try {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    isAdminPath = pathname.startsWith('/admin');
    isMessagesPath = pathname.startsWith('/messages');

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    const fetchedUser = await getUserWithRole();

    // ── Onboarding gate ──────────────────────────────────────────────────────
    // Check __meetuply_pc cookie FIRST (written by /api/onboarding immediately
    // after the Firestore transaction). This avoids ERR_FAILED redirect loops
    // on slow connections where Firestore writes haven't propagated yet.
    const EXEMPT_PATHS = ['/onboarding', '/login', '/signup', '/api', '/terms', '/privacy'];
    const isExempt = EXEMPT_PATHS.some(p => pathname.startsWith(p));
    if (fetchedUser && !isExempt) {
      const pcCookie = cookieStore.get('__meetuply_pc')?.value;
      const isComplete = pcCookie === '1' || fetchedUser.profileComplete !== false;
      if (!isComplete) {
        const { redirect } = await import('next/navigation');
        redirect('/onboarding');
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (fetchedUser) {
      const [wallet, fetchedPeople, fetchedEvents] = await Promise.all([
        getOrCreateWallet(fetchedUser.uid, fetchedUser.email).catch(() => null),
        fetchUsersAdmin(10).catch(() => []),
        fetchUpcomingEventsAdmin(5).catch(() => []),
      ]);

      user = JSON.parse(JSON.stringify({ ...fetchedUser, ...(wallet ? { wallet } : {}) }));
      people = (fetchedPeople || []).filter(p => p.id !== user?.id);
      events = fetchedEvents || [];
    }
  } catch (err) {
    if (err?.message?.includes('Dynamic server usage') || err?.digest?.startsWith('NEXT_')) {
      throw err;
    }
    console.error('[RootLayout] Firebase Admin init error:', err?.message);
  }

  return (
      <html lang="en" data-theme="light" style={{ colorScheme: 'light' }}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
          <meta name="theme-color" content="#8C3573" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Meetuply" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon-512.png?v=2" />
          <link rel="icon" type="image/png" href="/icon-512.png?v=2" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800" rel="stylesheet" />
        </head>
        <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100dvh', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
          <GoogleAuthProviderWrapper>
            <UserProvider initialUser={user} initialWallet={user?.wallet} initialPeople={people}>
              {/* FCM Push Notification initializer — client-only, non-rendering */}
              <FCMInitializer />
              {/* PWA Install Banner — shows when browser supports it */}
              <PWAInstallBanner />
              {/* Notification permission — friendly prompt shown once after login */}
              <NotificationPermissionPrompt user={user} />
              <div className="flex min-h-screen">
                <Sidebar user={user} />

                {/* Network wrapper shows Offline screen if connection lost */}
                <NetworkWrapper>
                  <MainContentWrapper user={user}>
                    {children}
                  </MainContentWrapper>
                </NetworkWrapper>
                
                <RightPanel people={people} upcomingEvents={events} />
              </div>
            </UserProvider>
          </GoogleAuthProviderWrapper>

        <Script id="pwa-sw" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.warn('SW registration failed:', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  );
}
