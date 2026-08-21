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
import MainContentWrapper from '../components/MainContentWrapper';

export const metadata = {
  title: 'Meetify — Your Campus Life',
  description: 'Join experiences, meet people, and grow your campus social circle with Meetify.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meetify',
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

      const fetchedUser = await getUserWithRole();

      // ── Onboarding gate ────────────────────────────────────────────────────────
      // If user is logged in but hasn't completed their profile, redirect to /onboarding
      const EXEMPT_PATHS = ['/onboarding', '/login', '/signup', '/api', '/terms', '/privacy'];
      const isExempt = EXEMPT_PATHS.some(p => pathname.startsWith(p));
      if (fetchedUser && fetchedUser.profileComplete === false && !isExempt) {
        const { redirect } = await import('next/navigation');
        redirect('/onboarding');
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
          <meta name="theme-color" content="#7c3aed" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Meetify" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon-512.png" />
          <link rel="icon" type="image/png" href="/icon-512.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800" rel="stylesheet" />
        </head>
        <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100dvh', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
          <GoogleAuthProviderWrapper>
            <UserProvider initialUser={user} initialWallet={user?.wallet} initialPeople={people}>
              {/* FCM Push Notification initializer — client-only, non-rendering */}
              <FCMInitializer />
              <div className="flex min-h-screen">
                <Sidebar user={user} />

                <MainContentWrapper>{children}</MainContentWrapper>
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
