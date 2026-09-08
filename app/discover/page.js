import { Suspense } from 'react';
import DiscoverClient from './DiscoverClient';

export const metadata = {
  title: 'Discover Campus Peers by Branch, Year & Skills | Meova',
  description: 'Find verified college students to connect with on Meova. Filter by branch, year, and availability. Book a coffee meet or send a quick message instantly.',
  keywords: [
    'find college peers', 'campus networking', 'college student connect',
    'campus social app', 'discover peers', 'student networking', 'meet campus students'
  ],
  alternates: { canonical: 'https://meova.in/discover' },
  openGraph: {
    title: 'Discover Campus Peers | Meova',
    description: 'Find verified college peers by branch, year, and skills. Book meets and network on Meova.',
    url: 'https://meova.in/discover',
    siteName: 'Meova',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[var(--accent)]">Loading Discover...</div>}>
      <DiscoverClient />
    </Suspense>
  );
}
