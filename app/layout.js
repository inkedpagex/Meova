import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from '../components/Sidebar';
import RightPanel from '../components/RightPanel';
import { getUserWithRole } from '../lib/getAdminUser';
import { getOrCreateWallet } from '../lib/wallet';
import { fetchUsersAdmin, fetchUpcomingEventsAdmin } from '../lib/supabaseQueries';
import Script from 'next/script';
import GoogleAuthProviderWrapper from '../components/GoogleAuthProviderWrapper';
import { headers } from 'next/headers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
});
import { UserProvider } from '../components/providers/UserProvider';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import ThemeSelectorModal from '../components/ThemeSelectorModal';
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
  themeColor: 'var(--accent)',
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meova.in'),
  title: {
    default: 'Meova — #1 Campus Social & Meetups | GLA University',
    template: '%s | Meova',
  },
  description: 'Meova is the #1 campus social platform for GLA University students in Mathura. Book 1-on-1 meetups, earn Sparks, and join student circles. Free to join.',
  keywords: [
    'Meova', 'Meova App', 'meova.in', 'www.meova.in', 'GLA University app', 'GLA campus social',
    'GLA meet app', 'GLA University Mathura', 'campus meetup app India',
    'student networking GLA', 'meetify alternative', 'meetifyy alternative', 'meetify GLA University', 'meetifyy GLA University',
    'earn Sparks GLA', 'student circles GLA', 'college app Mathura',
    'Campus Life', 'Student Meetups', 'College Networking',
    'College Circles', 'GLA University', 'Sparks Wallet'
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
    title: 'Meova — #1 Campus Social & Meetups | GLA University',
    description: 'Connect with GLA University peers, book verified 1-on-1 coffee meets, and join student circles on Meova.',
    images: [
      {
        url: 'https://meova.in/og-image.png',
        secureUrl: 'https://meova.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meova — GLA University Campus Social & Meetup Platform',
        type: 'image/png',
      },
      {
        url: 'https://meova.in/icon-512.png',
        secureUrl: 'https://meova.in/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Meova Campus Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@meovaapp',
    creator: '@meovaapp',
    title: 'Meova — #1 Campus Social & Meetups | GLA University',
    description: 'Connect with GLA University peers, book verified 1-on-1 coffee meets, and join student circles on Meova.',
    images: ['https://meova.in/og-image.png'],
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

  let initialMode = 'light';
  let initialAccent = 'purple';

  try {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    isAdminPath = pathname.startsWith('/admin');
    isMessagesPath = pathname.startsWith('/messages');

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    initialMode = cookieStore.get('meova_mode')?.value || 'light';
    initialAccent = cookieStore.get('meova_accent')?.value || 'purple';

    const fetchedUser = await getUserWithRole();

    // ── Global Block & Onboarding gate ───────────────────────────────────────
    if (fetchedUser) {
      if (fetchedUser.isBlocked) {
        // Render blocked UI entirely, overriding the rest of the layout below
        return (
          <html lang="en" data-mode={initialMode} data-accent={initialAccent} data-theme={`${initialMode}-${initialAccent}`} suppressHydrationWarning>
            <head>
              <meta name="google-site-verification" content="69gj3KxRDEUqq1GCnrE6EknJ-3WCbTit6UdLS21Mo0w" />
              <link rel="manifest" href="/manifest.json" />
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover, interactive-widget=resizes-content" />
              <meta name="theme-color" content={initialMode === 'dark' ? '#0D0D0D' : '#7C3AED'} />
            </head>
            <body style={{ background: 'var(--bg-base)', minHeight: '100dvh', margin: 0, padding: 0 }}>
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

  const { cookies: nextCookies, headers: nextHeaders } = await import('next/headers');
  const cookieStore = await nextCookies();
  const headersList = await nextHeaders();
  const host = headersList.get('host') || '';
  const isAmbassadorHost = host.startsWith('ambassador.');
  const isAdminHost = host.startsWith('admin.');
  const isStandaloneHost = isAmbassadorHost || isAdminHost;
  initialMode = initialMode || cookieStore.get('meova_mode')?.value || 'light';
  initialAccent = initialAccent || cookieStore.get('meova_accent')?.value || 'purple';

  return (
    <html
      lang="en"
      className={inter.variable}
      data-mode={initialMode}
      data-accent={initialAccent}
      data-theme={`${initialMode}-${initialAccent}`}
      suppressHydrationWarning
    >
        <head>
          {/* ── Zero-FOUC Instant Theme Initialization (Runs before body parse) ── */}
          <script
            id="theme-zero-fouc"
            dangerouslySetInnerHTML={{
              __html: `(function(){
                try {
                  var m = localStorage.getItem('meova_mode') || (document.cookie.match(/(?:^|; )meova_mode=([^;]+)/) || [])[1] || 'light';
                  var a = 'purple';
                  var doc = document.documentElement;
                  doc.setAttribute('data-mode', m);
                  doc.setAttribute('data-accent', a);
                  doc.setAttribute('data-theme', m + '-' + a);
                  var links = document.querySelectorAll("link[rel*='icon']");
                  links.forEach(function(l) {
                    if (l.getAttribute('sizes') === '48x48' || l.getAttribute('type') === 'image/x-icon') {
                      l.href = '/favicon-purple.png';
                    }
                  });
                } catch(e) {}
              })();`,
            }}
          />
          <meta name="google-site-verification" content="69gj3KxRDEUqq1GCnrE6EknJ-3WCbTit6UdLS21Mo0w" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />
          <meta name="theme-color" content={initialMode === 'dark' ? '#0D0D0D' : '#7C3AED'} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Meova" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="preconnect" href="https://dvqsosbeh.supabase.co" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://dvqsosbeh.supabase.co" />
          <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
          {/* ── Remix Icons — Premium icon library ── */}
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" />
          
          {/* ── Open Graph & Social Share Preview Meta Tags (WhatsApp, Telegram, Twitter, LinkedIn) ── */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Meova" />
          <meta property="og:url" content="https://meova.in" />
          <meta property="og:title" content="Meova — #1 Campus Social & Meetups | GLA University" />
          <meta property="og:description" content="Connect with GLA University peers, book verified 1-on-1 coffee meets, and join student circles on Meova." />
          <meta property="og:image" content="https://meova.in/og-image.png" />
          <meta property="og:image:secure_url" content="https://meova.in/og-image.png" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Meova — GLA University Campus Social Network" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@meovaapp" />
          <meta name="twitter:title" content="Meova — #1 Campus Social & Meetups | GLA University" />
          <meta name="twitter:description" content="Connect with GLA University peers, book verified 1-on-1 coffee meets, and join student circles on Meova." />
          <meta name="twitter:image" content="https://meova.in/og-image.png" />
          
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
                      'GLA Meet App', 'GLA Campus Social', 'meova.in', 'www.meova.in'
                    ],
                    'description': 'Meova is the #1 campus social platform for GLA University students in Mathura. Book 1-on-1 meetups, earn Sparks, and join student circles. Free to join.',
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
                    'description': 'Meova is the campus social and meetup platform for GLA University students in Mathura — with QR-verified meets, Sparks wallet, student circles, and a campus moments feed.',
                    'keywords': 'GLA University, campus meetup, student networking, meetify alternative, meetifyy alternative, GLA student network, Sparks wallet, campus social Mathura',
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
        <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100dvh', fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
          <TopProgressBar />
          <ThemeProvider initialMode={initialMode} initialAccent={initialAccent}>
            <GoogleAuthProviderWrapper>
              <UserProvider initialUser={user} initialWallet={user?.wallet} initialPeople={people}>
                <VoiceCallProvider>
                  {/* Global 1-Click Theme Customizer Modal */}
                  <ThemeSelectorModal />
                  {/* FCM Push Notification initializer — client-only, non-rendering */}
                  <FCMInitializer />
                  {/* PWA Install Banner — shows when browser supports it */}
                  <PWAInstallBanner />
                  {/* In-App Realtime Push Banner — custom Meova UI instead of Chrome native alert */}
                  <InAppNotificationBanner />
                  {/* Notification permission — friendly prompt shown once after login */}
                  <NotificationPermissionPrompt user={user} />
                  <div className="flex min-h-screen">
                    {!isStandaloneHost && <Sidebar user={user} />}

                    {/* Network wrapper shows Offline screen if connection lost */}
                    <NetworkWrapper>
                      <MainContentWrapper user={user} isAmbassadorHost={isStandaloneHost}>
                        {children}
                      </MainContentWrapper>
                    </NetworkWrapper>
                    
                    {!isStandaloneHost && <RightPanel people={people} upcomingEvents={events} />}
                  </div>
                </VoiceCallProvider>
              </UserProvider>
            </GoogleAuthProviderWrapper>
          </ThemeProvider>

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
