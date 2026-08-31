import './globals.css';
import Sidebar from '../components/Sidebar';
import RightPanel from '../components/RightPanel';
import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin, fetchUpcomingEventsAdmin } from '../lib/supabaseQueries';
import Script from 'next/script';
import GoogleAuthProviderWrapper from '../components/GoogleAuthProviderWrapper';
import { headers } from 'next/headers';
import { UserProvider } from '../components/providers/UserProvider';
import FCMInitializer from '../components/FCMInitializer';
import PWAInstallBanner from '../components/PWAInstallBanner';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import MainContentWrapper from '../components/MainContentWrapper';
import NetworkWrapper from '../components/NetworkWrapper';
import BlockedPage from './blocked/page';

export const metadata = {
  title: 'Meova — Your Campus Life',
  description: 'Connect with campus students, book 1-on-1 meetups, and join circles with Meova.',
  manifest: '/manifest.json',
  verification: {
    google: '69gj3KxRDEUqq1GCnrE6EknJ-3WCbTit6UdLS21Mo0w',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meova',
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

    // ── Global Block & Onboarding gate ───────────────────────────────────────
    if (fetchedUser) {
      if (fetchedUser.isBlocked) {
        // Render blocked UI entirely, overriding the rest of the layout below
        return (
          <html lang="en">
            <head>
              <meta name="google-site-verification" content="69gj3KxRDEUqq1GCnrE6EknJ-3WCbTit6UdLS21Mo0w" />
              <link rel="manifest" href="/manifest.json" />
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, interactive-widget=resizes-content" />
              <meta name="theme-color" content="#ffffff" />
            </head>
            <body style={{ background: '#f8fafc', minHeight: '100dvh', margin: 0, padding: 0 }}>
              <BlockedPage />
            </body>
          </html>
        );
      }

      const EXEMPT_PATHS = ['/onboarding', '/login', '/signup', '/api', '/terms', '/privacy', '/blocked'];
      const isExempt = EXEMPT_PATHS.some(p => pathname.startsWith(p));
      
      if (!isExempt) {
        const pcCookie = cookieStore.get('__Meova_pc')?.value;
        const isComplete = pcCookie === '1' || fetchedUser.profileComplete !== false;
        if (!isComplete) {
          const { redirect } = await import('next/navigation');
          redirect('/onboarding');
        }
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
          <meta name="google-site-verification" content="69gj3KxRDEUqq1GCnrE6EknJ-3WCbTit6UdLS21Mo0w" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />
          <meta name="theme-color" content="#F05A00" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Meova" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
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
