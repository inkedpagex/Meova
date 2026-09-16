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
import PWALaunchSplash from '../components/PWALaunchSplash';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#FFFFFF',
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meova.in'),
  title: {
    default: 'Meova — Campus Social Network & 1-on-1 Student Meetups',
    template: '%s | Meova',
  },
  description: 'Meova is the verified campus social network for university students. Connect with verified peers, book 1-on-1 study & coffee meetups, earn Sparks, and join student circles. Free to join.',
  keywords: [
    'Meova', 'Meova App', 'meova.in', 'www.meova.in', 'campus social network', 'college meetups',
    'student networking', 'campus meetup app India', 'coffee meetups', 'study sessions',
    'earn Sparks', 'student circles', 'college app', 'Campus Life', 'Student Meetups',
    'College Networking', 'College Circles', 'Sparks Wallet'
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
    title: 'Meova — Campus Social Network & 1-on-1 Student Meetups',
    description: 'Connect with verified university peers, book 1-on-1 study & coffee meets, and join student circles on Meova.',
    images: [
      {
        url: 'https://meova.in/og-image.png',
        secureUrl: 'https://meova.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meova — Campus Social & Meetup Platform',
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
    title: 'Meova — Campus Social Network & 1-on-1 Student Meetups',
    description: 'Connect with verified university peers, book 1-on-1 study & coffee meets, and join student circles on Meova.',
    images: ['https://meova.in/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    shortcut: '/favicon-48x48.png',
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
              <meta name="theme-color" content={initialMode === 'dark' ? '#0F1115' : '#FFFFFF'} />
            </head>
            <body style={{ background: initialMode === 'dark' ? '#0F1115' : '#FFFFFF', minHeight: '100dvh', margin: 0, padding: 0 }}>
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
          <meta name="theme-color" content={initialMode === 'dark' ? '#0F1115' : '#FFFFFF'} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Meova" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
          <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
          <link rel="icon" href="/favicon.ico" sizes="48x48" />
          <link rel="shortcut icon" href="/favicon.ico" />
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
          <meta property="og:title" content="Meova — Campus Social Network & 1-on-1 Student Meetups" />
          <meta property="og:description" content="Connect with verified university peers, book 1-on-1 study & coffee meets, and join student circles on Meova." />
          <meta property="og:image" content="https://meova.in/og-image.png" />
          <meta property="og:image:secure_url" content="https://meova.in/og-image.png" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Meova — Campus Social Network & Student Meetups" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@meovaapp" />
          <meta name="twitter:title" content="Meova — Campus Social Network & 1-on-1 Student Meetups" />
          <meta name="twitter:description" content="Connect with verified university peers, book 1-on-1 study & coffee meets, and join student circles on Meova." />
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
                      'Meova Campus', 'Meova App', 'Meova Web', 'meova.in', 'www.meova.in'
                    ],
                    'description': 'Meova is the verified campus social network for university students. Book 1-on-1 study & coffee meetups, earn Sparks, and join student circles. Free to join.',
                    'potentialAction': {
                      '@type': 'SearchAction',
                      'target': 'https://meova.in/discover?q={search_term_string}',
                      'query-input': 'required name=search_term_string'
                    }
                  },
                  {
                    '@type': 'SiteNavigationElement',
                    '@id': 'https://meova.in/#navigation',
                    'name': 'Meova Campus Navigation',
                    'hasPart': [
                      {
                        '@type': 'WebPage',
                        'name': 'Campus Feed',
                        'description': 'Share moments and see what students are doing on campus',
                        'url': 'https://meova.in/'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'Discover Peers',
                        'description': 'Find and connect with students by college, branch, year, and skills',
                        'url': 'https://meova.in/discover'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'Book Campus Meetups',
                        'description': 'Book verified 1-on-1 campus meetups with verified students. QR verified & Sparks secured.',
                        'url': 'https://meova.in/bookings'
                      },
                      {
                        '@type': 'WebPage',
                        'name': 'Student Circles & Communities',
                        'description': 'Join student circles — tech, design, sports, cultural clubs across universities',
                        'url': 'https://meova.in/circles'
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
                    'description': 'Meova is the verified campus social and meetup platform for college students — with QR-verified meets, Sparks wallet, student circles, and a campus moments feed.',
                    'keywords': 'campus social network, college meetups, student networking, campus peer meets, Sparks wallet, student circles',
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
                    'alternateName': ['Meova App', 'Meova Campus', 'Meova Network'],
                    'url': 'https://meova.in',
                    'logo': 'https://meova.in/icon-512.png',
                    'description': "Meova is India's verified campus social network and 1-on-1 student meetup platform designed for university students to connect, schedule coffee & study sessions, join student circles, and earn Sparks.",
                    'foundingLocation': {
                      '@type': 'Country',
                      'name': 'India'
                    },
                    'sameAs': [
                      'https://instagram.com/meova.in',
                      'https://twitter.com/meovaapp',
                      'https://linkedin.com/company/meova',
                      'https://github.com/inkedpagex/Meova'
                    ],
                    'knowsAbout': [
                      'Campus Social Network',
                      'Student Networking',
                      'College Meetups',
                      'Peer Mentorship',
                      'Student Circles',
                      'Sparks Wallet'
                    ],
                    'address': {
                      '@type': 'PostalAddress',
                      'addressCountry': 'IN'
                    },
                    'areaServed': {
                      '@type': 'Country',
                      'name': 'India'
                    }
                  },
                  {
                    '@type': 'FAQPage',
                    '@id': 'https://meova.in/#faq',
                    'mainEntity': [
                      {
                        '@type': 'Question',
                        'name': 'What is Meova?',
                        'acceptedAnswer': {
                          '@type': 'Answer',
                          'text': 'Meova is India\'s verified campus social network and 1-on-1 student meetup platform for university students. It allows verified college peers to discover classmates, schedule in-person coffee & study meetups, join campus circles, and earn Sparks.'
                        }
                      },
                      {
                        '@type': 'Question',
                        'name': 'How do campus meetups work on Meova?',
                        'acceptedAnswer': {
                          '@type': 'Answer',
                          'text': 'Students can discover peers by branch, year, or skills and request a 1-on-1 campus meetup. Sessions are verified via mutual QR code scanning and a live 20-minute meetup timer.'
                        }
                      }
                    ]
                  }
                ]
              })
            }}
          />
        </head>
        <body style={{ background: initialMode === 'dark' ? '#0F1115' : '#FFFFFF', color: 'var(--text-primary)', minHeight: '100dvh', fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
          {/* ── Installed PWA Launch Opening Screen (Renders ONLY on installed PWA standalone launch) ── */}
          <PWALaunchSplash />
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
          try {
            var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            if (isStandalone) {
              document.cookie = '__meova_pwa=1; path=/; max-age=31536000; SameSite=Lax';
            } else if (document.cookie.indexOf('__meova_pwa=') !== -1) {
              document.cookie = '__meova_pwa=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
            }
          } catch(e) {}
        `}} />
      </body>
    </html>
  );
}
