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
import { VoiceCallProvider } from '../components/providers/VoiceCallProvider';
import FCMInitializer from '../components/FCMInitializer';
import PWAInstallBanner from '../components/PWAInstallBanner';
import NotificationPermissionPrompt from '../components/NotificationPermissionPrompt';
import InAppNotificationBanner from '../components/InAppNotificationBanner';
import MainContentWrapper from '../components/MainContentWrapper';
import NetworkWrapper from '../components/NetworkWrapper';
import BlockedPage from './blocked/page';
import TopProgressBar from '../components/TopProgressBar';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#F05A00',
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meova.in'),
  title: {
    default: 'Meova — Campus Social & Meetup Platform',
    template: '%s | Meova',
  },
  description: 'Meova is the #1 campus social platform for GLA University students in Mathura. Book 1-on-1 meetups, earn Sparks on campus gigs, and join student circles. Free to join.',
  keywords: [
    'Meova', 'Meova App', 'meova.in', 'GLA University app', 'GLA campus social',
    'GLA meet app', 'GLA University Mathura', 'campus meetup app India',
    'student networking GLA', 'meetify alternative', 'meetifyy alternative', 'meetify GLA University', 'meetifyy GLA University',
    'campus gigs GLA', 'earn Sparks GLA', 'student circles GLA', 'college app Mathura',
    'Campus Life', 'Student Meetups', 'College Networking', 'Campus Gigs',
    'College Circles', 'GLA University', 'Student Freelancing', 'Sparks Wallet'
  ],
  manifest: '/manifest.json',
  verification: {
    google: '69gj3KxRDEUqq1GCnrE6EknJ-3WCbTit6UdLS21Mo0w',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meova',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://meova.in',
    siteName: 'Meova',
    title: 'Meova — Campus Social & Meetup Platform',
    description: 'Connect with college peers, book 1-on-1 study & coffee meetups, earn Sparks on campus gigs, and join student circles on Meova.',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Meova Campus Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meova — Campus Social & Meetup Platform',
    description: 'Connect with college peers, book 1-on-1 study & coffee meetups, earn Sparks on campus gigs, and join student circles on Meova.',
    images: ['/icon-512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800" rel="stylesheet" />
          
          {/* ── Google Search Rich Snippets & Sitelinks Structured Data (JSON-LD) ── */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                  {
                    '@type': 'WebSite',
                    '@id': 'https://meova.in/#website',
                    'url': 'https://meova.in',
                    'name': 'Meova',
                    'alternateName': [
                      'Meova Campus', 'Meova App', 'Meova Web',
                      'GLA Meet App', 'GLA Campus Social', 'meova.in'
                    ],
                    'description': 'Meova is the #1 campus social platform for GLA University students in Mathura. Book 1-on-1 meetups, earn Sparks on campus gigs, and join student circles. Free to join.',
                    'potentialAction': {
                      '@type': 'SearchAction',
                      'target': 'https://meova.in/discover?q={search_term_string}',
                      'query-input': 'required name=search_term_string'
                    },
                    'audience': {
                      '@type': 'EducationalAudience',
                      'educationalRole': 'student',
                      'geographicArea': {
                        '@type': 'Place',
                        'name': 'GLA University, Mathura, Uttar Pradesh, India'
                      }
                    }
                  },
                  {
                    '@type': 'SiteNavigationElement',
                    '@id': 'https://meova.in/#navigation',
                    'name': 'Meova Campus Navigation',
                    'hasPart': [
                      {
                        '@type': 'WebPage',
                        'name': 'GLA University Campus Feed',
                        'description': 'Share moments and see what GLA University students are doing on campus',
                        'url': 'https://meova.in/'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'GLA Campus Gigs — Earn Sparks',
                        'description': 'Post and apply for campus freelance gigs. Earn Sparks as a GLA University student.',
                        'url': 'https://meova.in/gigs'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'Discover GLA University Peers',
                        'description': 'Find and connect with GLA University students by branch, year, and skills',
                        'url': 'https://meova.in/discover'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'Book Campus Meetups — GLA Meet',
                        'description': 'Book verified 1-on-1 campus meetups with GLA University students. QR verified & Sparks secured.',
                        'url': 'https://meova.in/bookings'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'GLA Student Circles & Communities',
                        'description': 'Join GLA University student circles — tech, design, sports, cultural clubs',
                        'url': 'https://meova.in/circles'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'Meova for GLA University',
                        'description': 'Dedicated landing page for GLA University students on Meova — the campus social platform',
                        'url': 'https://meova.in/gla-university'
                      }
                    ]
                  },
                  {
                    '@type': 'SoftwareApplication',
                    '@id': 'https://meova.in/#app',
                    'name': 'Meova',
                    'operatingSystem': 'Web, Android, iOS',
                    'applicationCategory': 'SocialNetworkingApplication',
                    'applicationSubCategory': 'Campus Social & Meetup Platform',
                    'installUrl': 'https://meova.in',
                    'url': 'https://meova.in',
                    'screenshot': 'https://meova.in/icon-512.png',
                    'description': 'Meova is the campus social and meetup platform for GLA University students in Mathura — with QR-verified meets, campus gigs with Sparks, student circles, and a campus moments feed.',
                    'keywords': 'GLA University, campus meetup, student gigs, meetify alternative, meetifyy alternative, GLA student network, Sparks wallet, campus social Mathura',
                    'offers': {
                      '@type': 'Offer',
                      'price': '0',
                      'priceCurrency': 'INR'
                    },
                    'aggregateRating': {
                      '@type': 'AggregateRating',
                      'ratingValue': '4.8',
                      'reviewCount': '120',
                      'bestRating': '5'
                    }
                  },
                  {
                    '@type': 'Organization',
                    '@id': 'https://meova.in/#org',
                    'name': 'Meova',
                    'url': 'https://meova.in',
                    'logo': 'https://meova.in/icon-512.png',
                    'sameAs': [
                      'https://instagram.com/meova.in',
                      'https://twitter.com/meovaapp',
                      'https://linkedin.com/company/meova'
                    ],
                    'address': {
                      '@type': 'PostalAddress',
                      'addressLocality': 'Mathura',
                      'addressRegion': 'Uttar Pradesh',
                      'addressCountry': 'IN'
                    },
                    'areaServed': {
                      '@type': 'EducationalOrganization',
                      'name': 'GLA University',
                      'address': {
                        '@type': 'PostalAddress',
                        'streetAddress': 'NH-2, Mathura-Delhi Road',
                        'addressLocality': 'Mathura',
                        'addressRegion': 'Uttar Pradesh',
                        'postalCode': '281406',
                        'addressCountry': 'IN'
                      }
                    }
                  }
                ]
              })
            }}
          />
        </head>
        <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100dvh', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
          <TopProgressBar />
          <GoogleAuthProviderWrapper>
            <UserProvider initialUser={user} initialWallet={user?.wallet} initialPeople={people}>
              <VoiceCallProvider>
                {/* FCM Push Notification initializer — client-only, non-rendering */}
                <FCMInitializer />
                {/* PWA Install Banner — shows when browser supports it */}
                <PWAInstallBanner />
                {/* In-App Realtime Push Banner — custom Meova UI instead of Chrome native alert */}
                <InAppNotificationBanner />
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
              </VoiceCallProvider>
            </UserProvider>
          </GoogleAuthProviderWrapper>

        <Script id="pwa-install-handler" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.deferredPWAInstallPrompt = e;
          });
        `}} />
      </body>
    </html>
  );
}
